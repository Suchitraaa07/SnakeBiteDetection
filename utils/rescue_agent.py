# Placeholder for rescue agent logic
# utils/rescue_agent.py

def should_dispatch_rescue(bite_output, snake_output=None):

    if bite_output["prediction"] == "Snake Bite":
        if snake_output and snake_output["prediction"] == "Venomous":
            return True

    if bite_output["prediction"] == "Monkey Bite":
        return True

<<<<<<< HEAD
    return False
=======
    return False
>>>>>>> 15a4bc49157749e89a1f93a34e88940cf3455ade
