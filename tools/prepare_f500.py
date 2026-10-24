"""Merge the 2019 Fortune 500 list with geocoded HQ locations.

Inputs (data/):
  fortune500-2019.csv  rank, name, revenue, profit   (github.com/cmusam/fortune500)
  hq-hifld.csv         HQ city/state/lat/lon/website  (HIFLD "Fortune 500 Corporate
                       Headquarters", 2017 list, via github.com/anyfactor/f500hqviz)

Output: data/fortune500.json

Run once with `python3 tools/prepare_f500.py`; the site build reads the JSON.
"""
import csv
import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

# 2019 name -> name used in the HIFLD file, where the two lists spell it differently.
ALIASES = {
    "Costco Wholesale": "COSTCO",
    "DuPont de Nemours": "DUPONT",
    "United Parcel Service": "UPS",
    "Walt Disney": "DISNEY",
    "Energy Transfer": "ENERGY TRANSFER EQUITY",
    "HCA Healthcare": "HCA HOLDINGS",
    "DXC Technology": "COMPUTER SCIENCES CORPORATION",
    "Jabil": "JABIL CIRCUIT",
    "DaVita": "DAVITA HEALTHCARE PARTNERS",
    "Booking Holdings": "PRICELINE GROUP",
    "Qurate Retail": "LIBERTY INTERACTIVE",
    "Dominion Energy": "DOMINION RESOURCES",
    "L3 Technologies": "L-3 COMMUNICATIONS",
    "Discovery": "DISCOVERY COMMUNICATIONS",
    "IQVIA Holdings": "QUINTILES TRANSNATIONAL HOLDINGS",
    "Jones Financial (Edward Jones)": "JONES FINANCIAL",
    "Jefferies Financial Group": "LEUCADIA NATIONAL",
    "Newmont Goldcorp": "NEWMONT MINING",
    "L3Harris Technologies": "HARRIS",
}

# Companies missing from (or misplaced in) the HIFLD file: city, state, lat, lon, website.
MANUAL = {
    # HIFLD has these at the wrong (or pre-2019) HQ.
    "Abbott Laboratories": ("Abbott Park", "IL", 42.2930, -87.8890, "https://www.abbott.com"),
    "General Electric": ("Boston", "MA", 42.3530, -71.0490, "https://www.ge.com"),
    "Alcoa": ("Pittsburgh", "PA", 40.4440, -80.0040, "https://www.alcoa.com"),
    "Arconic": ("Pittsburgh", "PA", 40.4470, -80.0080, "https://www.arconic.com"),
    "Western Digital": ("San Jose", "CA", 37.2410, -121.7800, "https://www.westerndigital.com"),
    "Huntsman": ("The Woodlands", "TX", 30.1658, -95.4613, "https://www.huntsman.com"),
    "Boston Scientific": ("Marlborough", "MA", 42.3460, -71.5520, "https://www.bostonscientific.com"),
    "Occidental Petroleum": ("Houston", "TX", 29.7300, -95.4370, "https://www.oxy.com"),
    "Mosaic": ("Tampa", "FL", 27.9506, -82.4572, "https://www.mosaicco.com"),
    "Masco": ("Livonia", "MI", 42.3684, -83.3527, "https://www.masco.com"),
    "A-Mark Precious Metals": ("El Segundo", "CA", 33.9192, -118.4165, "https://www.amark.com"),
    # Not in the HIFLD file.
    "Broadcom": ("San Jose", "CA", 37.3770, -121.9010, "https://www.broadcom.com"),
    "BJ's Wholesale Club": ("Westborough", "MA", 42.2695, -71.6162, "https://www.bjs.com"),
    "Molson Coors Brewing": ("Denver", "CO", 39.7530, -104.9990, "https://www.molsoncoors.com"),
    "DCP Midstream": ("Denver", "CO", 39.7480, -104.9920, "https://www.dcpmidstream.com"),
    "Altice USA": ("Long Island City", "NY", 40.7447, -73.9485, "https://www.alticeusa.com"),
    "Pioneer Natural Resources": ("Irving", "TX", 32.8686, -96.9406, "https://www.pxd.com"),
    "Coty": ("New York", "NY", 40.7590, -73.9845, "https://www.coty.com"),
    "Adobe": ("San Jose", "CA", 37.3309, -121.8939, "https://www.adobe.com"),
    "Brighthouse Financial": ("Charlotte", "NC", 35.2271, -80.8431, "https://www.brighthousefinancial.com"),
    "Westlake Chemical": ("Houston", "TX", 29.7380, -95.4520, "https://www.westlake.com"),
    "Caesars Entertainment": ("Las Vegas", "NV", 36.1162, -115.1745, "https://www.caesars.com"),
    "Thor Industries": ("Elkhart", "IN", 41.6820, -85.9767, "https://www.thorindustries.com"),
    "Cheniere Energy": ("Houston", "TX", 29.7560, -95.3650, "https://www.cheniere.com"),
    "Conagra Brands": ("Chicago", "IL", 41.8885, -87.6354, "https://www.conagrabrands.com"),
    "EnLink Midstream": ("Dallas", "TX", 32.7870, -96.7990, "https://www.enlink.com"),
    "Keurig Dr Pepper": ("Burlington", "MA", 42.5048, -71.1956, "https://www.keurigdrpepper.com"),
    "Magellan Health": ("Phoenix", "AZ", 33.4484, -112.0740, "https://www.magellanhealth.com"),
    "American Axle & Manufacturing": ("Detroit", "MI", 42.3800, -83.0600, "https://www.aam.com"),
    "Fortive": ("Everett", "WA", 47.9790, -122.2021, "https://www.fortive.com"),
    "MasTec": ("Coral Gables", "FL", 25.7215, -80.2684, "https://www.mastec.com"),
    "Blackstone Group": ("New York", "NY", 40.7610, -73.9730, "https://www.blackstone.com"),
    "Wayfair": ("Boston", "MA", 42.3480, -71.0790, "https://www.wayfair.com"),
    "Wynn Resorts": ("Las Vegas", "NV", 36.1263, -115.1660, "https://www.wynnresorts.com"),
    "Ulta Beauty": ("Bolingbrook", "IL", 41.6986, -88.0684, "https://www.ulta.com"),
    "Regeneron Pharmaceuticals": ("Tarrytown", "NY", 41.0762, -73.8587, "https://www.regeneron.com"),
    "Northern Trust": ("Chicago", "IL", 41.8800, -87.6320, "https://www.northerntrust.com"),
    "Marathon Oil": ("Houston", "TX", 29.7500, -95.4600, "https://www.marathonoil.com"),
    "Cintas": ("Mason", "OH", 39.3600, -84.3099, "https://www.cintas.com"),
    "Advanced Micro Devices": ("Santa Clara", "CA", 37.3820, -121.9700, "https://www.amd.com"),
    "Hess": ("New York", "NY", 40.7560, -73.9840, "https://www.hess.com"),
    "Beacon Roofing Supply": ("Herndon", "VA", 38.9696, -77.3861, "https://www.becn.com"),
    "Post Holdings": ("St. Louis", "MO", 38.6270, -90.1994, "https://www.postholdings.com"),
    "Analog Devices": ("Norwood", "MA", 42.1945, -71.1995, "https://www.analog.com"),
    "Polaris Industries": ("Medina", "MN", 45.0353, -93.5822, "https://www.polaris.com"),
    "Graphic Packaging Holding": ("Atlanta", "GA", 33.8840, -84.4660, "https://www.graphicpkg.com"),
    "Intuit": ("Mountain View", "CA", 37.4275, -122.0975, "https://www.intuit.com"),
    "Tapestry": ("New York", "NY", 40.7540, -74.0010, "https://www.tapestry.com"),
    "ON Semiconductor": ("Phoenix", "AZ", 33.4350, -111.9900, "https://www.onsemi.com"),
    "Zoetis": ("Parsippany", "NJ", 40.8579, -74.4260, "https://www.zoetis.com"),
    "Williams-Sonoma": ("San Francisco", "CA", 37.7990, -122.4040, "https://www.williams-sonomainc.com"),
    "Navient": ("Wilmington", "DE", 39.7391, -75.5398, "https://www.navient.com"),
    "Peabody Energy": ("St. Louis", "MO", 38.6290, -90.1900, "https://www.peabodyenergy.com"),
    "Levi Strauss": ("San Francisco", "CA", 37.8020, -122.4030, "https://www.levistrauss.com"),
}

# Well-known HQ moves since the list was published. The map shows the current HQ.
MOVED = {
    "Tesla": ("Austin", "TX", 30.2222, -97.6175, 2021),
    "Oracle": ("Austin", "TX", 30.2400, -97.7230, 2020),
    "Hewlett Packard Enterprise": ("Houston", "TX", 30.0700, -95.4160, 2022),
    "Boeing": ("Arlington", "VA", 38.8580, -77.0500, 2022),
    "Caterpillar": ("Irving", "TX", 32.8700, -96.9400, 2022),
    "Honeywell International": ("Charlotte", "NC", 35.2271, -80.8431, 2019),
    "Charles Schwab": ("Westlake", "TX", 32.9900, -97.2000, 2021),
    "McKesson": ("Irving", "TX", 32.8800, -96.9600, 2019),
    "CBRE Group": ("Dallas", "TX", 32.7900, -96.8000, 2020),
    "AECOM": ("Dallas", "TX", 32.7850, -96.8050, 2021),
    "United Technologies": ("Arlington", "VA", 38.8600, -77.0520, 2020),
}

# Later names, for companies best known today by a different name.
NOW_KNOWN_AS = {
    "Facebook": "Meta Platforms",
    "United Technologies": "RTX",
    "AmerisourceBergen": "Cencora",
    "Anthem": "Elevance Health",
    "BB&T Corp.": "Truist Financial",
}

TECH = {
    "Apple", "Amazon.com", "Alphabet", "Microsoft", "Dell Technologies", "IBM", "Intel", "HP",
    "Facebook", "Cisco Systems", "Oracle", "Tech Data", "Hewlett Packard Enterprise",
    "Micron Technology", "Arrow Electronics", "DXC Technology", "Qualcomm", "Jabil", "Tesla",
    "Broadcom", "Western Digital", "Visa", "Synnex", "Avnet", "Applied Materials", "CDW",
    "Cognizant Technology Solutions", "Netflix", "Texas Instruments", "PayPal Holdings",
    "Mastercard", "Booking Holdings", "salesforce.com", "ADP", "Nvidia", "Corning",
    "Expedia Group", "Lam Research", "eBay", "Leidos Holdings", "Xerox", "First Data", "Adobe",
    "Fidelity National Information Services", "Amphenol", "Activision Blizzard",
    "Motorola Solutions", "Sanmina", "Insight Enterprises", "Advanced Micro Devices", "NCR",
    "Analog Devices", "Intuit", "NetApp", "ON Semiconductor", "Fiserv", "Wayfair",
}


def key(s):
    s = s.upper().replace("&", " AND ").replace(".COM", "")
    s = re.sub(r"[^A-Z0-9 ]", " ", s)
    s = re.sub(r"\b(CORP|CORPORATION|INC|CO|COS|COMPANIES|GROUP|HOLDINGS|HOLDING|THE|INTERNATIONAL|INTL|AND)\b", " ", s)
    return "".join(s.split())


def city_case(s):
    out = s.title()
    out = re.sub(r"\bMc([a-z])", lambda m: "Mc" + m.group(1).upper(), out)
    out = out.replace(" Of ", " of ").replace("Inver Grove Height", "Inver Grove Heights")
    return out.replace("Saint Louis", "St. Louis").replace("Saint Paul", "St. Paul").replace("Saint Petersburg", "St. Petersburg")


def site(url):
    url = url.strip().lower()
    if not url or url == "not available":
        return ""
    m = re.match(r"(https?://[^/#?]+)", url)
    return m.group(1) if m else ""


def slugify(s):
    s = s.lower().replace("&", " and ").replace("'", "").replace(".com", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def num(s):
    try:
        return round(float(s), 1)
    except ValueError:
        return None


def main():
    hq = {key(r["NAME"]): r for r in csv.DictReader(open(DATA / "hq-hifld.csv", encoding="utf-8-sig"))}
    out, slugs = [], set()
    for r in csv.DictReader(open(DATA / "fortune500-2019.csv")):
        name = r["company"]
        rec = {"rank": int(r["rank"]), "name": name, "revenue": num(r["revenue ($ millions)"]), "profit": num(r["profit ($ millions)"])}
        if name in MANUAL:
            city, state, lat, lon, web = MANUAL[name]
        else:
            h = hq.get(key(ALIASES.get(name, name)))
            if h is None:
                raise SystemExit(f"no HQ for {name}")
            city, state, lat, lon, web = city_case(h["CITY"]), h["STATE"], float(h["LATITUDE"]), float(h["LONGITUDE"]), site(h["WEBSITE"])
        rec.update(city=city, state=state, lat=round(lat, 4), lon=round(lon, 4), website=web)
        if name in MOVED:
            c, s, la, lo, yr = MOVED[name]
            rec["listed_hq"] = f"{city}, {state}"
            rec.update(city=c, state=s, lat=la, lon=lo, moved=yr)
        if name in NOW_KNOWN_AS:
            rec["now"] = NOW_KNOWN_AS[name]
        rec["sector"] = "tech" if name in TECH else "other"
        slug = slugify(NOW_KNOWN_AS.get(name, name))
        while slug in slugs:
            slug += "-2"
        slugs.add(slug)
        rec["slug"] = slug
        out.append(rec)
    missing = TECH - {r["name"] for r in out}
    if missing:
        raise SystemExit(f"tech names not in list: {missing}")
    (DATA / "fortune500.json").write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {len(out)} companies, {sum(r['sector'] == 'tech' for r in out)} tech")


if __name__ == "__main__":
    main()
