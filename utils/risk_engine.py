# Placeholder for risk engine logic
# utils/risk_engine.py

def compute_risk_score(bite_output, snake_output=None, geo_modifier=0):
    score = 0
    explanation = []

    if bite_output["prediction"] == "Snake Bite":
        score += 50
        explanation.append("Snake bite detected")

    if bite_output["prediction"] == "Monkey Bite":
        score += 40
        explanation.append("Monkey bite detected")

    if snake_output:
        if snake_output["prediction"] == "Venomous":
            score += 40
            explanation.append("Venomous species identified")

        if snake_output["confidence"] > 0.85:
            score += 10
            explanation.append("High model confidence")

    score += geo_modifier

    return {
        "risk_score": min(score, 100),
        "explanation": explanation
    }