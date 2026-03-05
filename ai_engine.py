# Placeholder for ai engine
# ai_engine.py

from utils.risk_engine import compute_risk_score
from utils.fusion_engine import fuse_predictions
from utils.geo_risk_engine import geo_risk_modifier
from utils.rescue_agent import should_dispatch_rescue
from utils.explainability import generate_explanation

def run_ai_system(bite_output, snake_output=None, region="Urban", rainfall=False):

    geo_modifier = geo_risk_modifier(region, rainfall)

    risk_data = compute_risk_score(bite_output, snake_output, geo_modifier)

    level = fuse_predictions(bite_output, snake_output)

    rescue = should_dispatch_rescue(bite_output, snake_output)

    explanation = generate_explanation(risk_data)

    return {
        "risk_score": risk_data["risk_score"],
        "risk_level": level,
        "rescue_required": rescue,
        "explanation": explanation
    }