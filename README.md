# Greadability.js

**Greadability.js** is a JavaScript library for computing global **g**raph **readability** metrics on graph layouts. These readability metrics help us answer questions like, which layout is better? Or, has the layout converged, or should it continue running?

At present, Greadability.js includes four global graph readability metrics:

* *Edge crossings* measures the fraction of edges that cross (intersect) out of an approximate maximum number that can cross.
* *Edge crossing angle* measures the mean deviation of edge crossing angles from the ideal edge crossing angle (70 degrees).
* *Angular resolution (minimum)* measures the mean deviation of adjacent incident edge angles from the ideal minimum angles (360 degrees divided by the degree of that node).
* *Angular resoluction (deviation)* measures the average deviation of angles between incident
edges on each vertex.

Each is a number in the range [0, 1] with higher numbers indicating better layouts. You can use this to measure when a graph layout algorithm has stopped improving (i.e. when it has [converged](https://bl.ocks.org/rpgove/8c8b08cc0ae1e1e969f5d2904a6a0e26)), or to find [good graph layout algorithm parameters](https://bl.ocks.org/rpgove/553450ed8ef2a48acd4121a85653d880).

[<img alt="Force Directed Layout Quality Convergence" src="https://raw.githubusercontent.com/rpgove/greadability/master/img/convergence.png" width="400" height="201">](https://bl.ocks.org/rpgove/8c8b08cc0ae1e1e969f5d2904a6a0e26)[<img alt="Automatically Finding Better Force Directed Layout Parameters (10x10 Grid)" src="https://raw.githubusercontent.com/rpgove/greadability/master/img/bestparameters.png" width="412" height="281">](https://bl.ocks.org/rpgove/553450ed8ef2a48acd4121a85653d880)

To use this module, create a layout for a graph (e.g. using [D3.js](https://d3js.org)) so that each vertex (also known as a *node*) has `x` and `y` properties for its coordinates and each edge (also known as a *link*) has `source` and `target` properties that point to vertices.

## Installing

Download the latest version from the [Greadability.js GitHub repository](https://github.com/rpgove/greadability/releases).

You can then use it in a webpage, like this:

```html
<script src="greadability.js"></script>
<script>

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).links(graph.links))
    .force("charge", d3.forceManyBody())
    .nodes(graph.nodes)
    .on("end", computeReadability);

function computeReadability () {
	var nodes = simulation.nodes();
	var links = simulation.force("link").links();
	console.log(greadability.greadability(nodes, links));
}

</script>
```

Or similarly in Node.js:

```js
const greadability = require('./greadability.js');

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).links(graph.links))
    .force("charge", d3.forceManyBody())
    .nodes(graph.nodes)
    .on("end", computeReadability);

function computeReadability () {
	var nodes = simulation.nodes();
	var links = simulation.force("link").links();
	console.log(greadability.greadability(nodes, links));
}
```

## API Reference

<a name="greadability" href="#greadability">#</a> <i>greadability</i>.<b>greadability</b>(<i>nodes</i>, <i>links</i>[, <i>id</i>]) [<>](https://github.com/rpgove/greadability/blob/master/greadability.js#L7 "Source")

Computes the readability metrics of the graph formed by the *nodes* and *links* and returns an object with the readability metrics as the properties and values:

```json
{
	crossing: 1,
	crossingAngle: 0.7,
	angularResolutionMin: 0.34,
	angularResolutionDev: 0.56
}
```

If *id* is specified, sets the node id accessor to the specified function. If *id* is not specified, uses the default node id accessor, which defaults to the node's index. Note that if each link's `source` and `target` properties are objects, then the node id accessor is not used. This is the same behavior as the forceSimulation in D3.js.
