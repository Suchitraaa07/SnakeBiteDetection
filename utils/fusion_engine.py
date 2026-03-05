# Placeholder for fusion engine logic
# utils/fusion_engine.py

def fuse_predictions(bite_output, snake_output=None):

    if bite_output["prediction"] == "Snake Bite":
        if snake_output and snake_output["prediction"] == "Venomous":
            return "CRITICAL"

        return "HIGH"

    if bite_output["prediction"] == "Monkey Bite":
        return "HIGH"

<<<<<<< HEAD
    return "MODERATE"
=======
    return "MODERATE"
>>>>>>> 15a4bc49157749e89a1f93a34e88940cf3455ade
