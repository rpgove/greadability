(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.greadability = global.greadability || {})));
}(this, (function (exports) { 'use strict';

var greadability = function (nodes, links) {
  var i,
      j,
      n = nodes.length,
      m = links.length,
      crossMat = {},
      degree = new Array(nodes.length),
      c = 0,
      cMax,
      idealAngle = 70,
      d,
      dMax;

  /*
  * Tracks the global graph readability metrics.
  */
  var graphStats = {
    crossing: 0, // Normalized link crossings
    crossingAngle: 0, // Normalized average dev from 70 deg
    angularResolutionMin: 0, // Normalized avg dev from ideal min angle
    angularResolutionDev: 0, // Normalized avg dev from each link
  };

  var getSumOfArray = function (numArray) {
    var i = 0, n = numArray.length, sum = 0;
    for (; i < n; ++i) sum += numArray[i];
    return sum;
  };

  var initialize = function () {
    var i, j, link1, link2, line1, line2, key, intersect;
    // Filter out self loops
    links = links.filter(function (l) {
      return l.source !== l.target;
    });

    for (i = 0; i < n; ++i) {
      nodes[i].index = i;
      degree[i] = [];
    }

    // Make sure source and target are nodes and not indices.
    // Calculate degree.
    for (i = 0; i < m; ++i) {
      link1 = links[i];
      if (typeof link1.source !== "object") link1.source = nodes[link1.source];
      if (typeof link1.target !== "object") link1.target = nodes[link1.target];

      link1.index = i;

      degree[link1.source.index].push(link1);
      degree[link1.target.index].push(link1);
    };
  }

  // Assume node.x and node.y are the coordinates

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

  function linksCross (link1, link2) {
    // Self loops are not intersections
    if (link1.index === link2.index ||
      link1.source === link1.target ||
      link2.source === link2.target) {
      return false;
    }

    // Links cannot intersect if they share a node
    if (link1.source === link2.source ||
      link1.source === link2.target ||
      link1.target === link2.source ||
      link1.target === link2.target) {
      return false;
    }

    var line1 = [
      [link1.source.x, link1.source.y],
      [link1.target.x, link1.target.y]
    ];

    var line2 = [
      [link2.source.x, link2.source.y],
      [link2.target.x, link2.target.y]
    ];

    return linesCross(line1, line2);
  }

  function linesCross (line1, line2) {
    var d1, d2, d3, d4;

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
    }

    return false;
  }

  function linkCrossings () {
    var i, j, c = 0;

    // Sum the upper diagonal of the edge crossing matrix.
    for (i = 0; i < m; ++i) {
      for (j = i + 1; j < m; ++j) {
        // Check if link i and link j intersect
        c += linksCross(links[i], links[j]) ? 1 : 0;
      }
    }

    return 2 * c;
  }

  function linesAngle (line1, line2, linesAreSegments) {
    // Acute angle of intersection, in degrees
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

      if (linksCross(link1, link2)) {
        line2 = [
          [link2.source.x, link2.source.y],
          [link2.target.x, link2.target.y]
        ];
        if (linesCross(line1, line2)) sum += Math.abs(idealAngle - linesAngle(line1, line2));
      }
    }

    return sum;
  }

  function linkCrossingAngle () {
    var i, j, d = 0, link1, link2, line1, line2;

    // Sum for the upper diagonal of the link crossing matrix.
    for (i = 0; i < m; ++i) {
      for (j = i + 1; j < m; ++j) {
        link1 = links[i], link2 = links[j];
        line1 = [
          [link1.source.x, link1.source.y],
          [link1.target.x, link1.target.y]
        ];
        line2 = [
          [link2.source.x, link2.source.y],
          [link2.target.x, link2.target.y]
        ];
        if (linesCross(line1, line2)) d += Math.abs(idealAngle - linesAngle(line1, line2));
      }
    }

    return 2 * d;
  }

  function angularResMin () {
    var j, d = 0, node, minAngle, idealMinAngle, incident;

    for (j = 0; j < n; ++j) {
      node = nodes[j];

      // Links that are incident to this node (already filtered out self loops)
      incident = degree[j];

      if (incident.length <= 1) continue;

      idealMinAngle = 360 / degree[j].length;

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

      minAngle = Math.min.apply(null, incident.map(function (l, i) {
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
    return d / degree.filter(function (d) { return d.length >= 1; }).length;
  }

  function angularResDev () {
    var j, d = 0, node, idealMinAngle, incident;

    for (j = 0; j < n; ++j) {
      node = nodes[j];

      // Links that are incident to this node (already filtered out self loops)
      incident = degree[j];

      if (incident.length <= 1) continue;

      idealMinAngle = 360 / degree[j].length;

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

      d += getSumOfArray(incident.map(function (l, i) {
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
      })) / degree[j].length;
    }

    // Divide by number of nodes with degree != 0
    return d / degree.filter(function (d) { return d.length >= 1; }).length;
  }

  initialize();

  cMax = (m * (m - 1) / 2) - getSumOfArray(degree.map(function (d) { return d.length * (d.length - 1); })) / 2;

  c = linkCrossings();

  dMax = c * idealAngle;

  d = linkCrossingAngle();

  graphStats.crossing = 1 - (cMax > 0 ? c / cMax : 0);

  graphStats.crossingAngle = 1 - (dMax > 0 ? d / dMax : 0);

  graphStats.angularResolutionMin = 1 - angularResMin();

  graphStats.angularResolutionDev = 1 - angularResDev();

  return graphStats;
};

exports.greadability = greadability;

Object.defineProperty(exports, '__esModule', { value: true });

})));