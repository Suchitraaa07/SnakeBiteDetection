# Placeholder for geo risk engine logic
# utils/geo_risk_engine.py

def geo_risk_modifier(region_type, rainfall=False):
    modifier = 0

    if region_type == "Forest":
        modifier += 15

    if region_type == "Agricultural":
        modifier += 10

    if rainfall:
        modifier += 5

<<<<<<< HEAD
    return modifier
=======
    return modifier
>>>>>>> 15a4bc49157749e89a1f93a34e88940cf3455ade
