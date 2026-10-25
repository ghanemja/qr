# SPDX-License-Identifier: MIT
# Copyright (c) 2026 ghanemja. QR Compass, https://ghanemja.github.io/qr/
"""Build data/fortune500.json from the 2026 Fortune 500 list.

Inputs:
  data/fortune500-2026.json  rank, name, revenue, profit, HQ city/state, sector, industry
                             (fortune.com/ranking/fortune500/2026, via its search API)
  data/earlier.json          page slug and website of each company on the earlier (2019) list,
                             so returning companies keep their links
  Census 2024 Gazetteer place file (2024_Gaz_place_national.txt), for HQ coordinates:
    https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip

Output: data/fortune500.json

Run with `python3 tools/prepare_f500.py path/to/2024_Gaz_place_national.txt`; the site
build reads the JSON.
"""
import json
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

STATES = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO", "Connecticut": "CT",
    "Delaware": "DE", "District of Columbia": "DC", "District Of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT",
    "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA",
    "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
    "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}

# 2026 name -> the name the company had on the earlier list (data/industries.json and the
# site's existing pages are keyed by it), where normalising the names doesn't match them.
EARLIER_NAME = {
    "StoneX Group": "INTL FCStone",
    "UPS": "United Parcel Service",
    "International Business Machines": "IBM",
    "TD Synnex": "Tech Data",
    "United Airlines Holdings": "United Continental Holdings",
    "United Services Automobile Assn.": "USAA",
    "GE Aerospace": "General Electric",
    "Bank of New York (BNY)": "Bank of New York Mellon",
    "Honeywell Technologies": "Honeywell International",
    "Dow": "Dow Inc.",
    "Mondelēz International": "Mondelez International",
    "World Kinect": "World Fuel Services",
    "Hartford Insurance Group": "Hartford Financial Services Group",
    "Newmont": "Newmont Goldcorp",
    "Fox": "Twenty-First Century Fox",
    "Lumen Technologies": "CenturyLink",
    "Labcorp Holdings": "Laboratory Corp. of America",
    "Molson Coors Beverage": "Molson Coors Brewing",
    "Jacobs Solutions": "Jacobs Engineering Group",
    "Westlake": "Westlake Chemical",
    "Estée Lauder": "Estee Lauder",
    "Automatic Data Processing": "ADP",
    "Synchrony": "Synchrony Financial",
    "Reliance": "Reliance Steel & Aluminum",
    "Paramount Skydance": "Viacom",
    "Meta Platforms": "Facebook",
    "RTX": "United Technologies",
    "Cencora": "AmerisourceBergen",
    "Elevance Health": "Anthem",
    "Truist Financial": "BB&T Corp.",
    "Warner Bros. Discovery": "Discovery",
}

# Fortune industry -> the 3D model archetype (src/models.js) for companies new to the list.
INDUSTRY_MODEL = [
    ("Insurance", "insurance"), ("Commercial Banks", "bank"), ("Securities", "bank"), ("Diversified Financials", "bank"),
    ("Savings Institutions", "bank"), ("Financial Data", "payments"), ("Health Care", "health"), ("Pharmaceuticals", "health"),
    ("Medical Products", "health"), ("Scientific", "health"), ("Mining, Crude-Oil", "oil"), ("Petroleum Refining", "oil"),
    ("Pipelines", "oil"), ("Oil and Gas", "oil"), ("Utilities", "power"), ("Energy", "power"), ("Semiconductors", "chip"),
    ("Computers", "computer"), ("Computer Software", "software"), ("Information Technology", "software"),
    ("Internet Services", "software"), ("Diversified Outsourcing", "software"), ("Temporary Help", "software"),
    ("Education", "software"), ("Telecommunications", "comms"), ("Network and Other Communications", "comms"),
    ("Entertainment", "media"), ("Publishing", "media"), ("Advertising", "media"), ("Aerospace", "rocket"),
    ("Airlines", "plane"), ("Mail, Package", "parcel"), ("Transportation", "parcel"), ("Trucking", "parcel"),
    ("Railroads", "parcel"), ("Shipping", "parcel"), ("Motor Vehicles", "car"), ("Automotive Retailing", "car"),
    ("Food Services", "food"), ("Food Consumer", "food"), ("Food Production", "food"), ("Beverages", "drink"),
    ("Household and Personal", "care"), ("Tobacco", "care"), ("Hotels, Casinos", "casino"), ("Chemicals", "chem"),
    ("Metals", "metal"), ("Real estate", "house"), ("Homebuilders", "house"), ("Building Materials", "house"),
    ("Home Equipment", "house"), ("Engineering", "industrial"), ("Industrial Machinery", "industrial"),
    ("Construction", "industrial"), ("Packaging", "industrial"), ("Waste", "industrial"), ("Electronics", "industrial"),
    ("Retail", "retail"), ("Wholesalers", "retail"), ("General Merchandisers", "retail"), ("Food and Drug Stores", "retail"),
    ("Apparel", "retail"), ("Toys", "retail"),
]

# Newcomers whose Fortune industry says little about what they are known for.
MODEL_PICK = {
    "Uber Technologies": "car", "Carvana": "car", "Coupang": "parcel", "DoorDash": "food", "Chipotle Mexican Grill": "food",
    "Campbell's": "food", "Airbnb": "house", "Welltower": "house", "Chewy": "retail", "Lululemon athletica": "retail",
    "Sprouts Farmers Market": "retail", "QVC Group": "media", "Sirius XM Holdings": "media", "Palo Alto Networks": "software",
    "Arista Networks": "comms", "Super Micro Computer": "computer", "Equinix": "computer", "Intuitive Surgical": "robot",
    "Monster Beverage": "drink", "Galaxy Digital": "payments", "Bitgo Holdings": "payments", "Nasdaq": "bank", "Moody's": "bank",
    "TransDigm Group": "plane", "Howmet Aerospace": "plane", "Corteva": "farm", "Andersons": "farm", "Prologis": "parcel",
    "Gold.com": "metal", "Kenvue": "care", "International Flavors & Fragrances": "chem", "GE Vernova": "power",
    "Constellation Energy": "power", "Vistra": "power", "Vertiv Holdings": "power", "XPO": "parcel", "GXO Logistics": "parcel",
    "Otis Worldwide": "industrial", "Medline": "health",
}

# Tech companies Fortune files under another sector.
TECH_TOO = {"Amazon", "Tesla", "Netflix", "Uber Technologies", "Airbnb", "DoorDash", "Booking Holdings", "Coupang", "eBay", "Block"}

# HQ cities the Gazetteer names differently.
CITY_FIX = {("Nashville", "TN"): "Nashville-Davidson", ("Louisville", "KY"): "Louisville/Jefferson County", ("Indianapolis", "IN"): "Indianapolis",
            ("Augusta", "GA"): "Augusta-Richmond County", ("Washington, D.C.", "DC"): "Washington", ("Boise", "ID"): "Boise City", ("Lexington", "KY"): "Lexington-Fayette", ("Honolulu", "HI"): "Urban Honolulu"}

# HQs in New England towns, townships and neighbourhoods the Gazetteer has no place for.
PLACE_COORDS = {
    ("Bloomfield", "CT"): (41.826, -72.730), ("Purchase", "NY"): (41.040, -73.715), ("Mayfield Village", "OH"): (41.552, -81.439),
    ("Abbott Park", "IL"): (42.293, -87.889), ("Wallingford", "CT"): (41.457, -72.823), ("Teaneck", "NJ"): (40.890, -74.011),
    ("Radnor", "PA"): (40.046, -75.360), ("Woodland Hills", "CA"): (34.168, -118.606), ("Farmington", "CT"): (41.720, -72.832),
    ("Antioch", "TN"): (36.060, -86.672), ("Johnston", "RI"): (41.822, -71.506), ("Long Island City", "NY"): (40.744, -73.949),
}


def norm(s):
    s = s.lower().replace("&", " and ").replace("ē", "e").replace("é", "e")
    s = re.sub(r"\.com\b", "", s)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\b(inc|corp|corporation|co|company|companies|group|holdings|holding|the|ltd|plc|international|worldwide|of america)\b", " ", s)
    return " ".join(s.split())


def slugify(s):
    s = s.lower().replace("&", " and ").replace("ē", "e").replace("é", "e")
    s = re.sub(r"['.]", "", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def place_key(name):
    name = re.sub(r"\s*\(balance\)", "", name)
    name = re.sub(r"\s+(city and borough|metropolitan government|metro government|unified government|consolidated government|urban county|city|town|township|village|borough|CDP|municipality)$", "", name)
    return name.lower()


def main():
    gaz = Path(sys.argv[1]) if len(sys.argv) > 1 else DATA / "2024_Gaz_place_national.txt"
    places = {}
    for line in gaz.read_text(encoding="utf-8", errors="replace").splitlines()[1:]:
        f = [x.strip() for x in line.split("\t")]
        key = (place_key(f[3]), f[0])
        # Prefer incorporated places (cities, towns) over census-designated places.
        if key not in places or f[4] != "57":
            places[key] = (round(float(f[10]), 4), round(float(f[11]), 4))
    earlier = {}
    industries = json.loads((DATA / "industries.json").read_text())
    known = {n for k, v in industries.items() if not k.startswith("_") for n in v}
    for n in known:
        earlier[norm(n)] = n
    prior = json.loads((DATA / "earlier.json").read_text())
    rows = json.loads((DATA / "fortune500-2026.json").read_text())
    out, missing = [], []
    for r in rows:
        state = STATES[r["state"]]
        city = r["city"]
        ll = PLACE_COORDS.get((city, state)) or places.get((CITY_FIX.get((city, state), city).lower(), state))
        if not ll:
            missing.append(f"{r['name']} ({city}, {state})")
            continue
        key = EARLIER_NAME.get(r["name"]) or earlier.get(norm(r["name"])) or r["name"]
        rec = {
            "rank": r["rank"], "name": r["name"], "key": key, "revenue": r["revenue"], "profit": r["profit"],
            "city": "Washington" if state == "DC" else city, "state": state, "lat": ll[0], "lon": ll[1],
            "website": (prior.get(key) or prior.get(r["name"]) or {}).get("website", ""),
            "sector": "tech" if r["sector"] == "Technology" or r["name"] in TECH_TOO else "other",
            "industry": r["industry"],
            "employees": int(r["employees"].replace(",", "")) if r.get("employees") else None,
            "slug": (prior.get(key) or prior.get(r["name"]) or {}).get("slug") or slugify(r["name"]),
        }
        if key not in known:
            rec["model"] = MODEL_PICK.get(r["name"]) or next((m for word, m in INDUSTRY_MODEL if word.lower() in (r["industry"] or "").lower()), "industrial")
        out.append(rec)
    if missing:
        raise SystemExit("no coordinates for: " + "; ".join(missing))
    (DATA / "fortune500.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"{len(out)} companies, {sum(1 for o in out if 'model' not in o)} with hand-picked models")


if __name__ == "__main__":
    main()
