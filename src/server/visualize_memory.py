import matplotlib.pyplot as plt
import json

TICKS_MAX = 30;
jsonFileHandler = open('memory.json', 'r')

jsonString = jsonFileHandler.read().removesuffix(",")
jsonList = json.loads("[" + jsonString + "]")

xAxis = [i for i in range(0, len(jsonList))]
rss = [item["rss"] for item in jsonList]
heapTotal = [item["heapTotal"] for item in jsonList]
heapUsed = [item["heapUsed"] for item in jsonList]
external = [item["external"] for item in jsonList]
arrayBuffers = [item["arrayBuffers"] for item in jsonList]
plt.grid(True)

## LINE GRAPH ##
plt.plot(xAxis, rss, scaley=True, color='red', label="rss")
plt.plot(xAxis, heapTotal, scaley=True, color='brown', label="heapTotal")
plt.plot(xAxis, heapUsed, scaley=True, color='blue', label="heapUsed")
plt.plot(xAxis, external, scaley=True, color='pink', label="external")
plt.plot(xAxis, arrayBuffers, scaley=True, color='green', label="arrayBuffers")
plt.yticks(ticks=[tick * 10000000 for tick in range(0, TICKS_MAX + 1)], labels=[str(tick * 10) for tick in range(0, TICKS_MAX + 1)])
plt.xlabel('sample')
plt.ylabel('size(MB)')
plt.legend()
plt.show()