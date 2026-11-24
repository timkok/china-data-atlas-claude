"""Source manifest: which official NBS China Statistical Yearbook table feeds which dataset.

Each yearbook edition E (中国统计年鉴E) publishes data for year E-1 (multi-year tables
cover several years). Table codes change between editions, so they are listed explicitly.
URLs: https://www.stats.gov.cn/sj/ndsj/{E}/html/{code}.{ext}
The 2021 edition also publishes machine-readable .xls files; other editions 2016-2025
publish table images (.jpg) only, which are transcribed by the OCR pipeline (ocr.py)
and must pass the review/validation gates before publication.
"""
BASE = "https://www.stats.gov.cn/sj/ndsj/{ed}/html/{code}.{ext}"
INDEX = "https://www.stats.gov.cn/sj/ndsj/{ed}/indexch.htm"

# table key -> {edition: code}
T = {
 "pop":   {2016:"0206CH",2017:"CH0206",2018:"CH0206",2019:"C0206",2020:"C0206",2021:"C02-05",2022:"C02-05",2023:"C02-05",2024:"C02-05",2025:"C02-05"},
 "urb":   {2016:"0207CH",2017:"CH0207",2018:"CH0207",2019:"C0207",2020:"C0207",2021:"C02-06",2022:"C02-06",2023:"C02-06",2024:"C02-06",2025:"C02-06"},
 "birth": {2016:"0208CH",2017:"CH0208",2018:"CH0208",2019:"C0208",2020:"C0208",2022:"C02-07",2023:"C02-07",2024:"C02-07",2025:"C02-07"},
 "age":   {2016:"0212CH",2017:"CH0212",2018:"CH0212",2019:"C0212",2020:"C0212",2021:"C02-16",2022:"C02-11",2023:"C02-11",2024:"C02-11",2025:"C02-11"},
 "gdp":   {2016:"0311CH",2017:"CH0309",2018:"CH0309",2019:"C0309",2020:"C0309",2021:"C03-09",2022:"C03-09",2023:"C03-09",2024:"C03-09",2025:"C03-09"},
 "gdppc16": {2016:"0310CH"},
 "inc":   {2016:"0617CH",2017:"CH0617",2018:"CH0617",2019:"C0617",2020:"C0617",2021:"C06-18",2022:"C06-18",2023:"C06-18",2024:"C06-18",2025:"C06-18"},
 "cons":  {2016:"0619CH",2017:"CH0619",2018:"CH0619",2019:"C0619",2020:"C0619",2021:"C06-20",2022:"C06-20",2023:"C06-20",2024:"C06-20",2025:"C06-20"},
 "stu":   {2016:"2124CH",2017:"CH2114",2018:"CH2114",2019:"C2114",2020:"C2114",2021:"C21-14",2022:"C21-14",2023:"C21-14",2024:"C21-14",2025:"C21-14"},
 "col":   {2016:"2125CH",2017:"CH2115",2018:"CH2115",2019:"C2115",2020:"C2115",2021:"C21-15",2022:"C21-15",2023:"C21-15",2024:"C21-15",2025:"C21-15"},
 "bed":   {2016:"2208CH",2017:"CH2208",2018:"CH2208",2019:"C2208",2020:"C2208",2021:"C22-08",2022:"C22-08",2023:"C22-08",2024:"C22-08",2025:"C22-08"},
 "fis":   {2016:"0705CH",2017:"CH0705",2018:"CH0705",2019:"C0705",2020:"C0705",2021:"C07-05",2022:"C07-05",2023:"C07-05",2024:"C07-05",2025:"C07-05"},
}
