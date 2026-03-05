import React, { useEffect, useRef, useState } from 'react';
import { Upload, MapPin, AlertCircle, CheckCircle2, User, Phone, FileText, Loader2 } from 'lucide-react';

const ReportForm = ({ onSubmitSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [animalPresent, setAnimalPresent] = useState(false);
    const [geoSubmitted, setGeoSubmitted] = useState(false);
    const [classifyingImage, setClassifyingImage] = useState(false);
    const [quickPrediction, setQuickPrediction] = useState(null);
    const firstAidRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({
        incidentType: 'snake_bite',
        image: null,
        imagePreview: null,
        latitude: null,
        longitude: null,
        addressText: '',
        victimName: '',
        victimAge: '',
        victimPhone: '',
        symptoms: [],
        notes: ''
    });

    // Symptom options
    const symptomOptions = {
        snake_bite: [
            { id: 'swelling', label: 'Swelling at bite site' },
            { id: 'pain', label: 'Severe pain' },
            { id: 'bleeding', label: 'Bleeding' },
            { id: 'nausea', label: 'Nausea/Vomiting' },
            { id: 'difficulty_breathing', label: 'Difficulty breathing' },
            { id: 'numbness', label: 'Numbness/Tingling' },
            { id: 'vision_problems', label: 'Blurred vision' },
            { id: 'weakness', label: 'Weakness/Fatigue' }
        ],
        monkey_bite: [
            { id: 'deep_wound', label: 'Deep wound' },
            { id: 'bleeding', label: 'Bleeding' },
            { id: 'swelling', label: 'Swelling' },
            { id: 'redness', label: 'Redness around wound' },
            { id: 'pain', label: 'Pain' },
            { id: 'fever', label: 'Fever' },
            { id: 'anxiety', label: 'Anxiety/Fear' }
        ]
    };

    // Handle image upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('Image size must be less than 10MB');
                return;
            }

            setError('');
            setQuickPrediction(null);
            setClassifyingImage(true);

            const reader = new FileReader();
            reader.onloadend = async () => {
                setFormData((prev) => ({
                    ...prev,
                    image: file,
                    imagePreview: reader.result
                }));

                try {
                    const predictionForm = new FormData();
                    predictionForm.append('image', file);

                    const response = await fetch('/api/ai/predict', {
                        method: 'POST',
                        body: predictionForm
                    });

                    const rawBody = await response.text();
                    let result = {};
                    if (rawBody) {
                        try {
                            result = JSON.parse(rawBody);
                        } catch {
                            result = { error: rawBody };
                        }
                    }

                    if (!response.ok) {
                        throw new Error(result.error || result.details || `Image analysis failed (${response.status})`);
                    }

                    setQuickPrediction(result);

                    if (result.prediction === 'snake_bite' || result.prediction === 'monkey_bite') {
                        setFormData((prev) => ({
                            ...prev,
                            incidentType: result.prediction
                        }));
                    }
                } catch (err) {
                    setError(err.message || 'Failed to analyze image.');
                } finally {
                    setClassifyingImage(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Get current location
    const getCurrentLocation = () => {
        setLoading(true);
        setError('');

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Reverse geocoding using OpenStreetMap Nominatim
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await response.json();

                    setFormData((prev) => ({
                        ...prev,
                        latitude,
                        longitude,
                        addressText: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    }));
                } catch (err) {
                    setFormData((prev) => ({
                        ...prev,
                        latitude,
                        longitude,
                        addressText: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    }));
                }

                setGeoSubmitted(false);
                setLoading(false);
            },
            (error) => {
                setError('Unable to get your location. Please enable location access.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleNext = async () => {
        if (step !== 2) {
            setStep(step + 1);
            return;
        }

        if (geoSubmitted) {
            setStep(step + 1);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const incidentResponse = await fetch('/geo/incident', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: formData.incidentType,
                    severity: 'unknown',
                    lat: formData.latitude,
                    lng: formData.longitude
                })
            });

            if (!incidentResponse.ok) {
                const body = await incidentResponse.text();
                throw new Error(body || 'Failed to store incident location');
            }

            if (animalPresent) {
                const sightingResponse = await fetch('/geo/sighting', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        animal: formData.incidentType,
                        lat: formData.latitude,
                        lng: formData.longitude
                    })
                });

                if (!sightingResponse.ok) {
                    const body = await sightingResponse.text();
                    throw new Error(body || 'Failed to store animal sighting');
                }
            }

            setGeoSubmitted(true);
            setStep(step + 1);
        } catch (err) {
            setError(err.message || 'Failed to update geospatial data');
        } finally {
            setLoading(false);
        }
    };

    // Handle symptom toggle
    const toggleSymptom = (symptomId) => {
        setFormData({
            ...formData,
            symptoms: formData.symptoms.includes(symptomId)
                ? formData.symptoms.filter(s => s !== symptomId)
                : [...formData.symptoms, symptomId]
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Create FormData object
            const submitData = new FormData();
            submitData.append('image', formData.image);
            submitData.append('incident_type', formData.incidentType);
            submitData.append('latitude', formData.latitude);
            submitData.append('longitude', formData.longitude);
            submitData.append('address_text', formData.addressText);
            submitData.append('victim_name', formData.victimName);
            submitData.append('victim_age', formData.victimAge);
            submitData.append('victim_phone', formData.victimPhone);
            submitData.append('symptoms', JSON.stringify(formData.symptoms));
            submitData.append('notes', formData.notes);

            // Submit to backend
            const response = await fetch('/api/reports/create', {
                method: 'POST',
                body: submitData
            });

            const rawBody = await response.text();
            let result = {};
            if (rawBody) {
                try {
                    result = JSON.parse(rawBody);
                } catch {
                    result = { error: rawBody };
                }
            }

            if (!response.ok) {
                throw new Error(result.error || result.details || `Failed to submit report (${response.status})`);
            }

            setSuccess(true);
            if (onSubmitSuccess) {
                onSubmitSuccess(result);
            }

        } catch (err) {
            setError(err.message || 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Validate step
    const canProceedToNextStep = () => {
        switch (step) {
            case 1:
                return formData.incidentType && formData.image;
            case 2:
                return formData.latitude && formData.longitude;
            case 3:
                return formData.symptoms.length > 0;
            default:
                return true;
        }
    };

    const getUrgencyBadgeClass = (urgency) => {
        switch ((urgency || '').toLowerCase()) {
            case 'immediate':
                return 'bg-red-600/90 text-white';
            case 'urgent':
                return 'bg-orange-500/90 text-white';
            case 'monitor_and_consult':
                return 'bg-yellow-500/90 text-black';
            default:
                return 'bg-moss-600/90 text-white';
        }
    };

    useEffect(() => {
        if (step === 1 && quickPrediction?.urgency === 'immediate' && firstAidRef.current) {
            firstAidRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [quickPrediction, step]);

    useEffect(() => {
        setGeoSubmitted(false);
    }, [animalPresent, formData.latitude, formData.longitude, formData.incidentType]);

    // Success screen
    if (success) {
        return (
            <div className="glass-card p-8 text-center">
                <CheckCircle2 className="w-20 h-20 text-moss-400 mx-auto mb-4 animate-float" />
                <h2 className="text-3xl font-bold text-white mb-3">Report Submitted Successfully!</h2>
                <p className="text-gray-300 mb-6">
                    Your emergency report has been received. Nearby hospitals have been notified.
                </p>
                <button
                    onClick={() => {
                        setSuccess(false);
                        setStep(1);
                        setAnimalPresent(false);
                        setGeoSubmitted(false);
                        setFormData({
                            incidentType: 'snake_bite',
                            image: null,
                            imagePreview: null,
                            latitude: null,
                            longitude: null,
                            addressText: '',
                            victimName: '',
                            victimAge: '',
                            victimPhone: '',
                            symptoms: [],
                            notes: ''
                        });
                    }}
                    className="btn-primary hover:shadow-2xl hover:scale-105 active:scale-95"
                >
                    Submit Another Report
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Report Emergency Bite
                </h2>
                <p className="text-gray-300">
                    Step {step} of 4 - Please provide accurate information
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                                s <= step ? 'bg-moss-500' : 'bg-white/20'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert-danger mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Step 1: Incident Type & Image Upload */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="form-label">Incident Type *</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, incidentType: 'snake_bite' })}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                                        formData.incidentType === 'snake_bite'
                                            ? 'border-moss-500 bg-moss-500/20 shadow-lg'
                                            : 'border-white/20 bg-white/5 hover:shadow-md hover:border-moss-400/50'
                                    }`}
                                >
                                    <div className="text-4xl mb-2">🐍</div>
                                    <div className="font-semibold text-white">Snake Bite</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, incidentType: 'monkey_bite' })}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                                        formData.incidentType === 'monkey_bite'
                                            ? 'border-moss-500 bg-moss-500/20 shadow-lg'
                                            : 'border-white/20 bg-white/5 hover:shadow-md hover:border-moss-400/50'
                                    }`}
                                >
                                    <div className="text-4xl mb-2">🐵</div>
                                    <div className="font-semibold text-white">Monkey Bite</div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Upload Bite Image *</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="block cursor-pointer"
                                >
                                    {formData.imagePreview ? (
                                        <div className="relative rounded-xl overflow-hidden border-2 border-moss-500">
                                            <img
                                                src={formData.imagePreview}
                                                alt="Preview"
                                                className="w-full h-64 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <Upload className="w-8 h-8 text-white" />
                                                <span className="ml-2 text-white font-semibold">Change Image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-white/30 rounded-xl p-12 text-center hover:border-moss-500 transition-colors">
                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-300 font-semibold mb-1">
                                                Click to upload image
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                PNG, JPG, WEBP up to 10MB
                                            </p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {classifyingImage && (
                            <div className="alert-success flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Analyzing image and classifying bite type...</span>
                            </div>
                        )}

                        {quickPrediction && !classifyingImage && (
                            <div className="alert-success">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold mb-1">Image classified successfully</p>
                                        <p className="text-sm opacity-90">
                                            Prediction: {quickPrediction.prediction || 'N/A'}
                                            {quickPrediction.species ? ` • Species: ${quickPrediction.species}` : ''}
                                        </p>
                                        {typeof quickPrediction.confidence === 'number' && (
                                            <p className="text-xs opacity-75 mt-1">
                                                Confidence: {(quickPrediction.confidence * 100).toFixed(1)}%
                                            </p>
                                        )}
                                        {quickPrediction.severity && (
                                            <p className="text-xs opacity-80 mt-1">
                                                Severity: {quickPrediction.severity}
                                            </p>
                                        )}
                                        {quickPrediction.urgency && (
                                            <div className="mt-2 inline-flex items-center gap-2">
                                                <span className="text-xs opacity-80">Urgency:</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getUrgencyBadgeClass(quickPrediction.urgency)}`}>
                                                    {quickPrediction.urgency.replaceAll('_', ' ')}
                                                </span>
                                            </div>
                                        )}
                                        {quickPrediction.wound_analysis && (
                                            <p className="text-xs opacity-80 mt-1">
                                                Swelling: {quickPrediction.wound_analysis.swelling_grade || 'N/A'}
                                                {' • '}Bleeding signal: {Math.round((quickPrediction.wound_analysis.bleeding_likelihood || 0) * 100)}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {quickPrediction?.urgency === 'immediate' && (
                            <div className="alert-danger flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-semibold">
                                        🚨 Immediate Action Required – Follow first aid steps below.
                                    </span>
                                </div>
                                <a
                                    href="tel:108"
                                    className="btn-danger whitespace-nowrap"
                                >
                                    Call Emergency (108)
                                </a>
                            </div>
                        )}

                        {quickPrediction?.recommendations?.length > 0 && (
                            <div
                                ref={firstAidRef}
                                className={`glass-card p-4 border border-red-500/40 ${
                                    quickPrediction?.urgency === 'immediate'
                                        ? 'sticky bottom-3 z-20 md:static'
                                        : ''
                                }`}
                            >
                                <h4 className="text-white font-semibold mb-2">Immediate First-Aid Guidance</h4>
                                <ul className="space-y-2 text-sm text-gray-200">
                                    {quickPrediction.recommendations.slice(0, 6).map((tip, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-moss-400 mt-0.5">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Location */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <label className="form-label">Location *</label>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Getting Location...
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-5 h-5" />
                                        Get Current Location
                                    </>
                                )}
                            </button>
                        </div>

                        {formData.latitude && (
                            <div className="alert-success">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold mb-1">Location Captured</p>
                                        <p className="text-sm opacity-90">{formData.addressText}</p>
                                        <p className="text-xs opacity-75 mt-1">📍 Latitude: {formData.latitude.toFixed(6)}</p>
                                        <p className="text-xs opacity-75">📍 Longitude: {formData.longitude.toFixed(6)}</p>
                                        <p className="text-xs opacity-75 mt-1">
                                            {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="form-label">⚠ Is the animal still nearby?</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAnimalPresent(true)}
                                    className={`p-3 rounded-lg border transition-all duration-300 ${
                                        animalPresent
                                            ? 'border-moss-500 bg-moss-500/20 text-white'
                                            : 'border-white/20 bg-white/5 text-gray-300'
                                    }`}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAnimalPresent(false)}
                                    className={`p-3 rounded-lg border transition-all duration-300 ${
                                        !animalPresent
                                            ? 'border-moss-500 bg-moss-500/20 text-white'
                                            : 'border-white/20 bg-white/5 text-gray-300'
                                    }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Address Details (Optional)</label>
                            <textarea
                                value={formData.addressText}
                                onChange={(e) => setFormData({ ...formData, addressText: e.target.value })}
                                className="input-field h-24 resize-none"
                                placeholder="Add any additional location details..."
                            />
                        </div>
                    </div>
                )}

                {/* Step 3: Symptoms */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <label className="form-label">Select Symptoms *</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {symptomOptions[formData.incidentType].map((symptom) => (
                                    <button
                                        key={symptom.id}
                                        type="button"
                                        onClick={() => toggleSymptom(symptom.id)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all duration-300 transform hover:-translate-y-1 ${
                                            formData.symptoms.includes(symptom.id)
                                                ? 'border-moss-500 bg-moss-500/20 shadow-lg'
                                                : 'border-white/20 bg-white/5 hover:border-white/40 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                                                formData.symptoms.includes(symptom.id)
                                                    ? 'bg-moss-500 border-moss-500'
                                                    : 'border-white/40'
                                            }`}>
                                                {formData.symptoms.includes(symptom.id) && (
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <span className="text-white font-medium">{symptom.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Victim Information */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div>
                            <label className="form-label flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Victim Name (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.victimName}
                                onChange={(e) => setFormData({ ...formData, victimName: e.target.value })}
                                className="input-field"
                                placeholder="Enter victim's name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">Age</label>
                                <input
                                    type="number"
                                    value={formData.victimAge}
                                    onChange={(e) => setFormData({ ...formData, victimAge: e.target.value })}
                                    className="input-field"
                                    placeholder="Age"
                                    min="0"
                                    max="120"
                                />
                            </div>
                            <div>
                                <label className="form-label flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.victimPhone}
                                    onChange={(e) => setFormData({ ...formData, victimPhone: e.target.value })}
                                    className="input-field"
                                    placeholder="Phone number"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Additional Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="input-field h-32 resize-none"
                                placeholder="Any additional information about the incident..."
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-8">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="btn-secondary flex-1"
                            disabled={loading}
                        >
                            Previous
                        </button>
                    )}
                    
                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="btn-primary flex-1"
                            disabled={!canProceedToNextStep() || loading}
                        >
                            {loading && step === 2 ? 'Saving...' : 'Next'}
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn-danger flex-1 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Emergency Report'
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ReportForm;
