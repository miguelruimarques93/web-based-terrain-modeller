/**
 * Created by Miguel Marques
 */
import d3 from 'd3';
import { deepCopy } from 'web_based_terrain_modeller/utils/utils';

@Inject('$scope', '$element')
class SplineEditorController
{
  constructor() {
    this.ngModel = this.$element.controller('ngModel');

    this.bounds_x = [50.0, 250.0];
    this.bounds_y = [10.0, 140.0];

    this.ngModel.$render = () => {
      this.calculate_internal_points();
      this.svg.select('path').datum(this.internal_points);
      this.redraw();
    };

    this.calculate_internal_points();

    this.selected = null;
    this.selected_index = -1;
    this.dragged = null;

    this.line = d3.svg.line();
    this.line.interpolate('monotone');

    this.svg = d3.select(this.$element[0]).append('svg');

    this.svg.append('path')
      .datum(this.internal_points)
      .attr('class', 'line')
      .call(this.redraw.bind(this))
    ;

    if (!this.is_disabled()) {
      d3.select(window)
        .on('mousemove', this.mousemove.bind(this))
        .on('mouseup', this.mouseup.bind(this));
    }

    this.update_scope();
  }

  is_disabled() {
    return this.$element.attr('disabled');
  }

  calculate_internal_points() {
    let points = [[0.0, 0.0], [0.25, 0.25], [0.75, 0.75], [1.0, 1.0]];

    if (this.ngModel.$viewValue && this.ngModel.$viewValue.points)
      points = this.ngModel.$viewValue.points;

    this.internal_points = deepCopy(points);

    for (let i = 0; i < this.internal_points.length; ++i) {
      this.internal_points[i][0] = this.internal_points[i][0] * (this.bounds_x[1] - this.bounds_x[0]) + this.bounds_x[0];
      this.internal_points[i][1] = this.internal_points[i][1] * (this.bounds_y[1] - this.bounds_y[0])/* + this.bounds_y[0]*/;
      this.internal_points[i][1] = this.bounds_y[1] - this.internal_points[i][1];
    }
  }

  redraw() {
    let svg = this.svg;
    svg.select('path').attr('d', this.line);

    let circle = svg.selectAll('circle')
      .data(this.internal_points, d => d);

    circle.enter().append('circle')
      .attr('r', 1e-6)
      .transition()
      .duration(750)
      .ease('elastic')
      .attr('r', 6.5);

    if (!this.is_disabled())
      circle.on('mousedown', this.mousedown.bind(this));

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

  mousedown(d) {
    if (!this.is_disabled()) {
      this.selected = this.dragged = d;
      this.selected_index = this.internal_points.indexOf(this.selected);

      this.redraw();
    }
  }

  mousemove() {
    if (!this.is_disabled()) {
      if (!this.dragged) return;

      let m = d3.mouse(this.svg.node());

      if (this.selected_index != 0 && this.selected_index != this.internal_points.length - 1) {
        this.dragged[0] = Math.max(
          this.internal_points[this.selected_index - 1][0] + 20.0,
          Math.min(this.internal_points[this.selected_index + 1][0] - 20.0, m[0]));
      }

      this.dragged[1] = Math.max(this.bounds_y[0], Math.min(this.bounds_y[1], m[1]));

      this.update_scope();
      this.redraw();
    }
  }

  mouseup() {
    if (!this.is_disabled()) {
      if (!this.dragged) return;
      this.mousemove();
      this.dragged = null;
    }
  }

  slope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }

  update_tangents(points) {
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

    let tangents = [];

    let s = (points[1][0] - points[0][0]) / (6 * (1 + m[0] * m[0]));
    tangents.push(m[0] * s || 0);

    for (let i = 1; i < n_points - 1; ++i) {
      s = (points[i + 1][0] - points[i - 1][0]) / (6 * (1 + m[i] * m[i]));
      tangents.push(m[i] * s || 0);
    }

    s = (points[n_points - 1][0] - points[n_points - 2][0]) / (6 * (1 + m[n_points - 1] * m[n_points - 1]));
    tangents.push(m[n_points - 1] * s || 0);

    return tangents;
  }

  update_points() {
    let points = deepCopy(this.internal_points);

    for (let i = 0; i < this.internal_points.length; ++i) {
      points[i][0] = (this.internal_points[i][0] - this.bounds_x[0]) / (this.bounds_x[1] - this.bounds_x[0]);
      points[i][1] = this.bounds_y[1] - this.internal_points[i][1];
      points[i][1] = (points[i][1]) / (this.bounds_y[1] - this.bounds_y[0]);
    }

    return points;
  }

  update_scope() {
    if (this.is_disabled()) return;

    let points = this.update_points();
    let tangents = this.update_tangents(points);
    this.ngModel.$setViewValue({points: points, tangents: tangents});
  }
}

@Inject('$parse')
class SplineEditor {
  constructor() {
    this.restrict = 'E';
    this.scope = {
    };
    this.require = 'ngModel';
    this.controller = SplineEditorController;
  }

  static factory() {
    return new SplineEditor();
  }
}

SplineEditor.directive_name = 'splineEditor';

export default SplineEditor;