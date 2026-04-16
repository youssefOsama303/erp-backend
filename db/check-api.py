import urllib.request
url='http://localhost:5502/api/warehouse/public-products'
with urllib.request.urlopen(url) as r:
    data=r.read()
print('len', len(data))
print(data[:500].decode('utf-8', 'replace'))
