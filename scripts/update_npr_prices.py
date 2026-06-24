import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from app.core.database import SessionLocal
from app.models.product import Product

def get_live_rate() -> float:
    try:
        response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=5)
        rate = response.json()['rates'].get('NPR', 151.78)
        print(f'Live USD to NPR rate: {rate}')
        return rate
    except Exception as e:
        print(f'Failed to fetch rate: {e}. Using fallback 151.78')
        return 151.78

def update_npr_prices():
    rate = get_live_rate()
    db = SessionLocal()
    products = db.query(Product).filter(Product.price_usd != None).all()
    updated = 0
    for p in products:
        if p.price_usd:
            p.price_npr = round(p.price_usd * rate)
            updated += 1
    db.commit()
    print(f'Updated {updated} products with rate {rate}')
    db.close()

if __name__ == "__main__":
    update_npr_prices()