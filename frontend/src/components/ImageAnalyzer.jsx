import React, { useState } from 'react';
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const ImageAnalyzer = () => {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError('Image size must be less than 10MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(file);
            setImagePreview(reader.result);
            setError('');
            setResult(null);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!image) {
            setError('Please upload an image first.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('image', image);

            const response = await fetch('/api/ai/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                const msg = data.error || 'Failed to analyze image';
                const details = data.details?.error || data.details || '';
                throw new Error(details ? `${msg}: ${details}` : msg);
            }

            setResult(data.aiAnalysis || null);
        } catch (err) {
            setError(err.message || 'Failed to analyze image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card p-6 md:p-8">
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Image Analyzer
                </h2>
                <p className="text-gray-300">
                    Upload a bite image to see the model&apos;s prediction without creating a report.
                </p>
            </div>

            {error && (
                <div className="alert-danger mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="form-label">Upload Bite Image *</label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="analyzer-image-upload"
                        />
                        <label
                            htmlFor="analyzer-image-upload"
                            className="block cursor-pointer"
                        >
                            {imagePreview ? (
                                <div className="relative rounded-xl overflow-hidden border-2 border-moss-500">
                                    <img
                                        src={imagePreview}
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

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleAnalyze}
                        className="btn-primary flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            'Analyze Image'
                        )}
                    </button>
                </div>

                {result && (
                    <div className="mt-6 alert-success">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold mb-1 text-white">
                                    Model Prediction
                                </h3>
                                <p className="text-gray-200">
                                    <strong>Prediction:</strong> {result.prediction || 'unknown'}
                                    {result.species ? ` (${result.species})` : ''}
                                </p>
                                <p className="text-gray-200">
                                    <strong>Confidence:</strong> {(result.confidence ?? 0).toFixed(2)}
                                    {result.snake_count != null ? ` • Count: ${result.snake_count}` : ''}
                                </p>
                                {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                                    <ul className="mt-2 text-sm text-gray-200 list-disc list-inside space-y-1">
                                        {result.recommendations.map((rec, idx) => (
                                            <li key={idx}>{rec}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageAnalyzer;

