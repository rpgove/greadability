greadability = function (nodes, links) {
  'use strict';

  var i, n, m, degree, c, cMax, idealAngle, d, dMax; 

  n = nodes.length;
  m = links.length;
  degree = new Array(n);
  idealAngle = 70;

  /*
  * Tracks the global graph readability metrics.
  */
  var graphStats = {
    crossing: 0, // Normalized link crossings
    crossingAngle: 0, // Normalized average dev from 70 deg
    angularResolutionMin: 0, // Normalized avg dev from ideal min angle
    angularResolutionDev: 0, // Normalized avg dev from each link
    nodes: nodes,
    links: links,
  };

  for (i = 0; i < n; ++i) {
    nodes[i].index = i;
    degree[i] = 0;
  }

  // Make sure source and target are nodes and not indices.
  // Calculate degree.
  links.forEach(function (l) {
    if (typeof l.source !== "object") l.source = nodes[l.source];
    if (typeof l.target !== "object") l.target = nodes[l.target];

    degree[l.source.index] += 1;
    degree[l.target.index] += 1;
  });

  // Assume node.x and node.y are the coordinates

  function linesCross (line1, line2) {
    var d1, d2, d3, d4;

    function direction (pi, pj, pk) {
      var p1 = [pk[0] - pi[0], pk[1] - pi[1]];
      var p2 = [pj[0] - pi[0], pj[1] - pi[1]];
      return p1[0] * p2[1] - p2[0] * p1[1];
    }

    function onSegment (pi, pj, pk) {
      return Math.min(pi[0], pj[0]) <= pk[0] &&
        pk[0] <= Math.max(pi[0], pj[0]) &&
        Math.min(pi[1], pj[1]) <= pk[1] &&
        pk[1] <= Math.max(pi[1], pj[1]);
    }

    // CLRS 2nd ed. pg. 937
    d1 = direction(line2[0], line2[1], line1[0]);
    d2 = direction(line2[0], line2[1], line1[1]);
    d3 = direction(line1[0], line1[1], line2[0]);
    d4 = direction(line1[0], line1[1], line2[1]);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    } else if (d1 === 0 && onSegment(line2[0], line2[1], line1[0])) {
      return true;
    } else if (d2 === 0 && onSegment(line2[0], line2[1], line1[1])) {
      return true;
    } else if (d3 === 0 && onSegment(line1[0], line1[1], line2[0])) {
      return true;
    } else if (d4 === 0 && onSegment(line1[0], line1[1], line2[1])) {
      return true;
    } else {
      return false;
    }
  }

  function linkCrossings () {
    var i, j, c = 0, cMax, line1, line2;

    for (i = 0; i < links.length; ++i) {
      line1 = [
        [links[i].source.x, links[i].source.y],
        [links[i].target.x, links[i].target.y]
      ];

      for (j = 0; j < links.length; ++j) {
        if (i === j) continue;

        // Links cannot intersect if they share a node
        if (links[i].source === links[j].source ||
          links[i].source === links[j].target ||
          links[i].target === links[j].source ||
          links[i].target === links[j].target) {
          continue;
        }

        line2 = [
          [links[j].source.x, links[j].source.y],
          [links[j].target.x, links[j].target.y]
        ];

        // Check if link i and link j intersect
        c += linesCross(line1, line2) ? 1 : 0;
      }
    }

    return c;
  }

  function linesAngle (line1, line2, linesAreSegments) {
    // Acute angle of intersection, in degrees
    if (linesAreSegments && !linesCross(line1, line2)) return 0;

    // TODO: case where both slopes == 0 but angle should be 180
    var slope1 = (line1[1][1] - line1[0][1]) / (line1[1][0] - line1[0][0]);
    var slope2 = (line2[1][1] - line2[0][1]) / (line2[1][0] - line2[0][0]);
    var angle = Math.abs(Math.atan(slope1) - Math.atan(slope2));

    return (angle > Math.PI / 2 ? Math.PI - angle : angle) * 180 / Math.PI;
  }

  function linkAngleDevSum (link1) {
    var j, line1, line2, link2, sum = 0;

    line1 = [
      [link1.source.x, link1.source.y],
      [link1.target.x, link1.target.y]
    ];

    for (j = 0; j < m; ++j) {
      link2 = links[j];
      if (link1 === link2) continue;

      // Links cannot intersect if they share a node
      if (link1.source === link2.source ||
        link1.source === link2.target ||
        link1.target === link2.source ||
        link1.target === link2.target) {
        continue;
      }

      line2 = [
        [link2.source.x, link2.source.y],
        [link2.target.x, link2.target.y]
      ];

      if (linesCross(line1, line2)) {
        sum += Math.abs(idealAngle - linesAngle(line1, line2, true));
      }
    }

    return sum;
  }

  function linkCrossingAngle () {
    var i, d = 0;

    for (i = 0; i < m; ++i) {
      d += linkAngleDevSum(links[i]);
    }

    return d;
  }

  function angularResMin () {
    var j, d = 0, node, minAngle, idealMinAngle, incident;

    for (j = 0; j < n; ++j) {
      node = nodes[j];

      if (!degree[j]) continue;

      idealMinAngle = 360 / degree[j];

      // Links that are incident to this node, but exclude self loops
      incident = links.filter(function (l) {
        return (l.source === node || l.target === node) &&
          !(l.source === node && l.target === node);
      });

      // Sort edges by the angle they make from an imaginary vector
      // emerging at angle 0 on the unit circle.
      // Necessary for calculating angles of incident edges correctly
      incident.sort(function (a, b) {
        var line0 = [[node.x, node.y], [node.x+1, node.y]];
        var lineA = [
          [a.source.x, a.source.y],
          [a.target.x, a.target.y]
        ];
        var lineB = [
          [b.source.x, b.source.y],
          [b.target.x, b.target.y]
        ];
        return linesAngle(line0, lineB) - linesAngle(line0, lineA);
      });

      minAngle = d3.min(incident.map(function (l, i) {
        var nextLink = incident[(i + 1) % incident.length];
        var line1 = [
          [l.source.x, l.source.y],
          [l.target.x, l.target.y]
        ];
        var line2 = [
          [nextLink.source.x, nextLink.source.y],
          [nextLink.target.x, nextLink.target.y]
        ];
        return linesAngle(line1, line2);
      }));

      d += Math.abs(idealMinAngle - minAngle) / idealMinAngle;
    }

    // Divide by number of nodes with degree != 0
    return d / degree.filter(function (d) { return d; }).length;
  }

  function angularResDev () {
    var j, d = 0, node, idealMinAngle, incident;

    for (j = 0; j < n; ++j) {
      node = nodes[j];

      if (!degree[j]) continue;

      idealMinAngle = 360 / degree[j];

      // Links that are incident to this node, but exclude self loops
      incident = links.filter(function (l) {
        return (l.source === node || l.target === node) &&
          !(l.source === node && l.target === node);
      });

      // Sort edges by the angle they make from an imaginary vector
      // emerging at angle 0 on the unit circle.
      // Necessary for calculating angles of incident edges correctly
      incident.sort(function (a, b) {
        var line0 = [[node.x, node.y], [node.x+1, node.y+1]];
        var lineA = [
          [a.source.x, a.source.y],
          [a.target.x, a.target.y]
        ];
        var lineB = [
          [b.source.x, b.source.y],
          [b.target.x, b.target.y]
        ];
        return linesAngle(line0, lineB) - linesAngle(line0, lineA);
      });

      d += d3.sum(incident.map(function (l, i) {
        var nextLink = incident[(i + 1) % incident.length];
        var line1 = [
          [l.source.x, l.source.y],
          [l.target.x, l.target.y]
        ];
        var line2 = [
          [nextLink.source.x, nextLink.source.y],
          [nextLink.target.x, nextLink.target.y]
        ];
        return Math.abs(idealMinAngle - linesAngle(line1, line2)) / idealMinAngle;
      })) / degree[j];
    }

    // Divide by number of nodes with degree != 0
    return d / degree.filter(function (d) { return d; }).length;
  }

  cMax = (m * (m - 1) / 2) - d3.sum(degree.map(function (d) { return d * (d - 1); })) / 2;

  c = linkCrossings();

  dMax = c * idealAngle;

  d = linkCrossingAngle();

  graphStats.crossing = 1 - (cMax > 0 ? c / cMax : 0);

  graphStats.crossingAngle = 1 - (dMax > 0 ? d / dMax : 0);

  graphStats.angularResolutionMin = 1 - angularResMin();

  graphStats.angularResolutionDev = 1 - angularResDev();

  return graphStats;
};