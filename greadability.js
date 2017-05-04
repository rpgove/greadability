greadability = function (nodes, links) {
  'use strict';

  var i, n, m, degree; 

  n = nodes.length;
  m = links.length;
  degree = new Array(n);

  /*
  * Tracks the global graph readability metrics.
  */
  var graphStats = {
    crossing: 0, // Normalized link crossings
    crossingAngle: 0, // Normalized average dev from 70 deg
    crossingAngleMin: 0, // Normalized avg dev from ideal min angle
    crossingAngleDev: 0, // Normalized avg dev from each link
    nodes: nodes,
    links: links,
  };

  for (i = 0; i < n; ++i) {
    nodes[i].index = i;
  }

  // Make sure source and target are nodes and not indices.
  // Calculate degree.
  links.forEach(function (l) {
    if (typeof l.source !== "object") l.source = nodes[links.source];
    if (typeof l.target !== "object") l.target = nodes[links.target];

    degree[l.source.index] = (degree[l.source.index] || 0) + 1;
    degree[l.target.index] = (degree[l.target.index] || 0) + 1;
  });

  // Assume node.x and node.y are the coordinates

  function calculateLinkCrossings () {
    var i, j, c = 0, cMax, line1, line2, d1, d2, d3, d4;

    function direction (pi, pj, pk) {
      var p1 = [pk[0] - pi[0], pk[1] - pi[1]];
      var p2 = [pj[0] - pi[0], pk[1] - pi[1]];
      return p1[0] * p2[1] - p2[0] * p1[1];
    }

    function onSegment (pi, pj, pk) {
      return Math.min(pi[0], pj[0]) <= pk[0] &&
        pk[0] <= Math.max(pi[0], pj[0]) &&
        Math.min(pi[1], pj[1]) <= pk[1] &&
        pk[1] <= Math.max(pi[1], pj[1]);
    }

    for (i = 0; i < links.length; ++i) {
      line1 = [
        [links[i].source.x, links[i].source.y],
        [links[i].target.x, links[i].target.y]
      ];

      for (j = i + 1; j < links.length; ++j) {
        // Check if node i and node j intersect
        line2 = [
          [links[j].source.x, links[j].source.y],
          [links[j].target.x, links[j].target.y]
        ];

        // CLRS 2nd ed. pg. 937
        d1 = direction(line2[0], line2[1], line1[0]);
        d2 = direction(line2[0], line2[1], line1[1]);
        d3 = direction(line1[0], line1[1], line2[0]);
        d4 = direction(line1[0], line1[1], line2[1]);

        if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
          ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
          ++c;
        } else if (d1 === 0 && onSegment(line2[0], line2[1], line1[0])) {
          ++c;
        } else if (d2 === 0 && onSegment(line2[0], line2[1], line1[1])) {
          ++c;
        } else if (d3 === 0 && onSegment(line1[0], line1[1], line2[0])) {
          ++c;
        } else if (d4 === 0 && onSegment(line1[0], line1[1], line2[1])) {
          ++c;
        }
      }
    }

    cMax = (m * (m - 1) / 2) - d3.sum(degree.map(function (d) { return d * d - 1})) / 2;

    return 1 - (cMax > 0 ? c / cMax : 0);
  }

  function calculateLinkCrossingAngle () {}

  graphStats.crossing = calculateLinkCrossings();

  return graphStats;
};