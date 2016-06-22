/**
 * Created by Miguel Marques
 */
import d3 from 'd3';
import { deepCopy } from 'web_based_terrain_modeller/utils/utils';

@Inject('$scope', '$element')
class SplineEditorController
{
  constructor() {
    this.bounds_x = [50.0, 250.0];
    this.bounds_y = [10.0, 140.0];

    if (this.$scope.data.points) {
      this.internal_points = deepCopy(this.$scope.data.points);

      for (let i = 0; i < this.internal_points.length; ++i) {
        this.internal_points[i][0] = this.internal_points[i][0] * (this.bounds_x[1] - this.bounds_x[0]) + this.bounds_x[0];
        this.internal_points[i][1] = this.internal_points[i][1] * (this.bounds_y[1] - this.bounds_y[0])/* + this.bounds_y[0]*/;
        this.internal_points[i][1] = this.bounds_y[1] - this.internal_points[i][1];
      }
    } else {
      this.internal_points = [
        [50.0, 140.0],
        [116.7, 96.6],
        [183.3, 53.3],
        [250.0, 10.0]
      ];
    }

    this.selected = this.internal_points[0];
    this.selected_index = 0;
    this.dragged = null;

    this.line = d3.svg.line();
    this.line.interpolate('monotone');

    this.svg = d3.select(this.$element[0]).append('svg');

    this.svg.append('path')
      .datum(this.internal_points)
      .attr('class', 'line')
      .call(this.redraw.bind(this));

    d3.select(window)
      .on('mousemove', this.mousemove.bind(this))
      .on('mouseup', this.mouseup.bind(this));

    this.update_scope();
  }

  redraw() {
    let svg = this.svg;
    svg.select('path').attr('d', this.line);

    let circle = svg.selectAll('circle')
      .data(this.internal_points, d => d);

    circle.enter().append('circle')
      .attr('r', 1e-6)
      .on('mousedown', this.mousedown.bind(this))
      .transition()
      .duration(750)
      .ease('elastic')
      .attr('r', 6.5);

    circle
      .classed('selected', d => d == this.selected)
      .attr('cx', d => d[0])
      .attr('cy', d => d[1]);

    circle.exit().remove();

    if (d3.event) {
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }

  /*change() {
   this.redraw();
   }*/

  mousedown(d) {
    this.selected = this.dragged = d;
    this.selected_index = this.internal_points.indexOf(this.selected);


    this.redraw();
  }

  mousemove() {
    if (!this.dragged) return;

    let m = d3.mouse(this.svg.node());

    if (this.selected_index != 0 && this.selected_index != this.internal_points.length - 1) {
      this.dragged[0] = Math.max(
        this.internal_points[this.selected_index - 1][0] + 20.0,
        Math.min(this.internal_points[this.selected_index + 1][0] - 20.0, m[0]));
    }

    this.dragged[1] = Math.max(this.bounds_y[0], Math.min(this.bounds_y[1], m[1]));

    this.redraw();
  }

  mouseup() {
    if (!this.dragged) return;
    this.mousemove();
    this.update_scope();
    this.dragged = null;
  }

  slope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }

  update_tangents() {
    let points = this.$scope.data.points;
    let n_points = points.length;
    let m = [];
    let d = m[0] = this.slope(points[0], points[1]);

    for (let i = 1; i < n_points - 1; ++i) {
      m[i] = d;
      d = this.slope(points[i], points[i + 1]);
      m[i] = (m[i] + d) / 2.0;
    }
    m[n_points - 1] = d;

    for (let i = 0; i < n_points - 1; ++i) {
      let slope = this.slope(points[i], points[i + 1]);

      if (Math.abs(slope) < 1e-6) {
        m[i] = m[i + 1] = 0;
      } else {
        let alpha = m[i] / slope;
        let beta = m[i + 1] / slope;

        let s = alpha * alpha + beta * beta;
        if (s > 9) {
          s = slope * 3 / Math.sqrt(s);
          m[i] = s * alpha;
          m[i + 1] = s * beta;
        }
      }
    }

    this.$scope.data.tangents = [];

    let s = (points[1][0] - points[0][0]) / (6 * (1 + m[0] * m[0]));
    this.$scope.data.tangents.push(m[0] * s || 0);

    for (let i = 1; i < n_points - 1; ++i) {
      s = (points[i + 1][0] - points[i - 1][0]) / (6 * (1 + m[i] * m[i]));
      this.$scope.data.tangents.push(m[i] * s || 0);
    }

    s = (points[n_points - 1][0] - points[n_points - 2][0]) / (6 * (1 + m[n_points - 1] * m[n_points - 1]));
    this.$scope.data.tangents.push(m[n_points - 1] * s || 0);
  }

  update_points() {
    this.$scope.data.points = deepCopy(this.internal_points);

    for (let i = 0; i < this.internal_points.length; ++i) {
      this.$scope.data.points[i][0] = (this.internal_points[i][0] - this.bounds_x[0]) / (this.bounds_x[1] - this.bounds_x[0]);
      this.$scope.data.points[i][1] = this.bounds_y[1] - this.internal_points[i][1];
      this.$scope.data.points[i][1] = (this.$scope.data.points[i][1]) / (this.bounds_y[1] - this.bounds_y[0]);
    }
  }

  update_scope() {
    this.update_points();
    this.update_tangents();
  }
}

@Inject('$parse')
class SplineEditor {
  constructor() {
    this.restrict = 'E';
    this.scope = {
      data: '=data'
    };
    this.controller = SplineEditorController;
  }

  static factory() {
    return new SplineEditor();
  }
}

SplineEditor.directive_name = 'splineEditor';

export default SplineEditor;