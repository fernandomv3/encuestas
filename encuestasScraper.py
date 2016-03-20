#! /usr/bin/env python3

from bs4 import BeautifulSoup
import json
import requests

def main():
  url = "http://www.eleccionesenperu.com/encuestas-presidenciales-peru.php"
  r = requests.get(url)
  html = r.text
  soup = BeautifulSoup(html,'html.parser')
  table = soup.find(id="tabla-d")
  headers = table.find_all("tr")[1].find_all("td")

  headers = [ td.text for td in headers]
  headers = headers[:-2]
  headers[0] = "foto"
  new = []
  for td in headers:
    i = td.find("  Ver ")
    if i != -1 :
       new.append(td[:i])
    else:
      new.append(td)
  headers = new

  rows = table.find_all("tr")[2:]
  cured_data = []
  for r in rows:
    cols = r.find_all("td")[:-2]
    dataRow={}
    for i,c in enumerate(cols):
      if i == 0:
        dataRow[headers[i]] = c.contents[0]["src"]
      elif i == 1:
        name , party = c.find_all(text=True)
        dataRow[headers[i]] = name
        dataRow["partido"] = party
      else:
        dataRow[headers[i]] = c.get_text()
        if c.get_text() == "":
           dataRow[headers[i]] = None
    cured_data.append(dataRow)
  print (json.dumps(cured_data))

if __name__ == "__main__":
  main()