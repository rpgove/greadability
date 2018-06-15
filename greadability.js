(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.greadability = global.greadability || {})));
}(this, (function (exports) { 'use strict';

var greadability = function (nodes, links, id) {
  var i,
      j,
      n = nodes.length,
      m,
      degree = new Array(nodes.length),
      cMax,
      idealAngle = 70,
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
    var i, j, link;
    var nodeById = {};
    // Filter out self loops
    links = links.filter(function (l) {
      return l.source !== l.target;
    });

    m = links.length;

    if (!id) {
      id = function (d) { return d.index; };
    }

    for (i = 0; i < n; ++i) {
      nodes[i].index = i;
      degree[i] = [];
      nodeById[id(nodes[i], i, nodeById)] = nodes[i];
    }

    // Make sure source and target are nodes and not indices.
    for (i = 0; i < m; ++i) {
      link = links[i];
      if (typeof link.source !== "object") link.source = nodeById[link.source];
      if (typeof link.target !== "object") link.target = nodeById[link.target];
    }

    // Filter out duplicate links
    var filteredLinks = [];
    links.forEach(function (l) {
      var s = l.source, t = l.target;
      if (s.index > t.index) {
        filteredLinks.push({source: t, target: s});
      } else {
        filteredLinks.push({source: s, target: t});
      }
    });
    links = filteredLinks;
    links.sort(function (a, b) {
      if (a.source.index < b.source.index) return -1;
      if (a.source.index > b.source.index) return 1;
      if (a.target.index < b.target.index) return -1;
      if (a.target.index > b.target.index) return 1;
      return 0;
    });
    i = 1;
    while (i < links.length) {
      if (links[i-1].source.index === links[i].source.index &&
        links[i-1].target.index === links[i].target.index) {
        links.splice(i, 1);
      }
      else ++i;
    }

    // Update length, if a duplicate was deleted.
    m = links.length;

    // Calculate degree.
    for (i = 0; i < m; ++i) {
      link = links[i];
      link.index = i;

      degree[link.source.index].push(link);
      degree[link.target.index].push(link);
    };
  }

  // Assume node.x and node.y are the coordinates

  function direction (pi, pj, pk) {
    var p1 = [pk[0] - pi[0], pk[1] - pi[1]];
    var p2 = [pj[0] - pi[0], pj[1] - pi[1]];
    return p1[0] * p2[1] - p2[0] * p1[1];
  }

  // Is point k on the line segment formed by points i and j?
  // Inclusive, so if pk == pi or pk == pj then return true.
  function onSegment (pi, pj, pk) {
    return Math.min(pi[0], pj[0]) <= pk[0] &&
      pk[0] <= Math.max(pi[0], pj[0]) &&
      Math.min(pi[1], pj[1]) <= pk[1] &&
      pk[1] <= Math.max(pi[1], pj[1]);
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

  function linkCrossings () {
    var i, j, c = 0, d = 0, link1, link2, line1, line2;;

    // Sum the upper diagonal of the edge crossing matrix.
    for (i = 0; i < m; ++i) {
      for (j = i + 1; j < m; ++j) {
        link1 = links[i], link2 = links[j];

        // Check if link i and link j intersect
        if (linksCross(link1, link2)) {
          line1 = [
            [link1.source.x, link1.source.y],
            [link1.target.x, link1.target.y]
          ];
          line2 = [
            [link2.source.x, link2.source.y],
            [link2.target.x, link2.target.y]
          ];
          ++c;
          d += Math.abs(idealAngle - acuteLinesAngle(line1, line2));
        }
      }
    }

    return {c: 2*c, d: 2*d};
  }

  function linesegmentsAngle (line1, line2) {
    // Finds the (counterclockwise) angle from line segement line1 to
    // line segment line2. Assumes the lines share one end point.
    // If both endpoints are the same, or if both lines have zero
    // length, then return 0 angle.
    // Param order matters:
    // linesegmentsAngle(line1, line2) != linesegmentsAngle(line2, line1)
    var temp, len, angle1, angle2, sLine1, sLine2;

    // Re-orient so that line1[0] and line2[0] are the same.
    if (line1[0][0] === line2[1][0] && line1[0][1] === line2[1][1]) {
      temp = line2[1];
      line2[1] = line2[0];
      line2[0] = temp;
    } else if (line1[1][0] === line2[0][0] && line1[1][1] === line2[0][1]) {
      temp = line1[1];
      line1[1] = line1[0];
      line1[0] = temp;
    } else if (line1[1][0] === line2[1][0] && line1[1][1] === line2[1][1]) {
      temp = line1[1];
      line1[1] = line1[0];
      line1[0] = temp;
      temp = line2[1];
      line2[1] = line2[0];
      line2[0] = temp;
    }

    // Shift the line so that the first point is at (0,0).
    sLine1 = [
      [line1[0][0] - line1[0][0], line1[0][1] - line1[0][1]],
      [line1[1][0] - line1[0][0], line1[1][1] - line1[0][1]]
    ];
    // Normalize the line length.
    len = Math.hypot(sLine1[1][0], sLine1[1][1]);
    if (len === 0) return 0;
    sLine1[1][0] /= len;
    sLine1[1][1] /= len;
    // If y < 0, angle = acos(x), otherwise angle = 360 - acos(x)
    angle1 = Math.acos(sLine1[1][0]) * 180 / Math.PI;
    if (sLine1[1][1] < 0) angle1 = 360 - angle1;

    // Shift the line so that the first point is at (0,0).
    sLine2 = [
      [line2[0][0] - line2[0][0], line2[0][1] - line2[0][1]],
      [line2[1][0] - line2[0][0], line2[1][1] - line2[0][1]]
    ];
    // Normalize the line length.
    len = Math.hypot(sLine2[1][0], sLine2[1][1]);
    if (len === 0) return 0;
    sLine2[1][0] /= len;
    sLine2[1][1] /= len;
    // If y < 0, angle = acos(x), otherwise angle = 360 - acos(x)
    angle2 = Math.acos(sLine2[1][0]) * 180 / Math.PI;
    if (sLine2[1][1] < 0) angle2 = 360 - angle2;

    return angle1 <= angle2 ? angle2 - angle1 : 360 - (angle1 - angle2);
  }

  function acuteLinesAngle (line1, line2) {
    // Acute angle of intersection, in degrees. Assumes these lines
    // intersect.
    var slope1 = (line1[1][1] - line1[0][1]) / (line1[1][0] - line1[0][0]);
    var slope2 = (line2[1][1] - line2[0][1]) / (line2[1][0] - line2[0][0]);

    // If these lines are two links incident on the same node, need
    // to check if the angle is 0 or 180.
    if (slope1 === slope2) {
      // If line2 is not on line1 and line1 is not on line2, then
      // the lines share only one point and the angle must be 180.
      if (!(onSegment(line1[0], line1[1], line2[0]) && onSegment(line1[0], line1[1], line2[1])) ||
        !(onSegment(line2[0], line2[1], line1[0]) && onSegment(line2[0], line2[1], line1[1])))
        return 180;
      else return 0;
    }

    var angle = Math.abs(Math.atan(slope1) - Math.atan(slope2));

    return (angle > Math.PI / 2 ? Math.PI - angle : angle) * 180 / Math.PI;
  }

  function angularRes () {
    var j,
        resMin = 0,
        resDev = 0,
        nonZeroDeg,
        node,
        minAngle,
        idealMinAngle,
        incident,
        line0,
        line1,
        line2,
        incidentLinkAngles,
        nextLink;

    nonZeroDeg = degree.filter(function (d) { return d.length >= 1; }).length;

    for (j = 0; j < n; ++j) {
      node = nodes[j];
      line0 = [[node.x, node.y], [node.x+1, node.y]];

      // Links that are incident to this node (already filtered out self loops)
      incident = degree[j];

      if (incident.length <= 1) continue;

      idealMinAngle = 360 / incident.length;

      // Sort edges by the angle they make from an imaginary vector
      // emerging at angle 0 on the unit circle.
      // Necessary for calculating angles of incident edges correctly
      incident.sort(function (a, b) {
        line1 = [
          [a.source.x, a.source.y],
          [a.target.x, a.target.y]
        ];
        line2 = [
          [b.source.x, b.source.y],
          [b.target.x, b.target.y]
        ];
        var angleA = linesegmentsAngle(line0, line1);
        var angleB = linesegmentsAngle(line0, line2);
        return angleA < angleB ? -1 : angleA > angleB ? 1 : 0;
      });

      incidentLinkAngles = incident.map(function (l, i) {
        nextLink = incident[(i + 1) % incident.length];
        line1 = [
          [l.source.x, l.source.y],
          [l.target.x, l.target.y]
        ];
        line2 = [
          [nextLink.source.x, nextLink.source.y],
          [nextLink.target.x, nextLink.target.y]
        ];
        return linesegmentsAngle(line1, line2);
      });

      minAngle = Math.min.apply(null, incidentLinkAngles);

      resMin += Math.abs(idealMinAngle - minAngle) / idealMinAngle;

      resDev += getSumOfArray(incidentLinkAngles.map(function (angle) {
        return Math.abs(idealMinAngle - angle) / idealMinAngle;
      })) / (2 * incident.length - 2);
    }

    // Divide by number of nodes with degree != 0
    resMin = resMin / nonZeroDeg;

    // Divide by number of nodes with degree != 0
    resDev = resDev / nonZeroDeg;

    return {resMin: resMin, resDev: resDev};
  }

  initialize();

  cMax = (m * (m - 1) / 2) - getSumOfArray(degree.map(function (d) { return d.length * (d.length - 1); })) / 2;

  var crossInfo = linkCrossings();

  dMax = crossInfo.c * idealAngle;

  graphStats.crossing = 1 - (cMax > 0 ? crossInfo.c / cMax : 0);

  graphStats.crossingAngle = 1 - (dMax > 0 ? crossInfo.d / dMax : 0);

  var angularResInfo = angularRes();

  graphStats.angularResolutionMin = 1 - angularResInfo.resMin;

  graphStats.angularResolutionDev = 1 - angularResInfo.resDev;

  return graphStats;
};

exports.greadability = greadability;

Object.defineProperty(exports, '__esModule', { value: true });

})));
