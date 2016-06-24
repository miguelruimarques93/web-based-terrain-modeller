/**
 * Created by Miguel Marques
 */

import angular from 'angular';
import _ from 'underscore';
import THREE from 'three';
import 'three-orbit-controls'

@Inject('$element', '$scope', '$timeout')
class TerrainViewerController
{
  constructor() {
    this.needs_update = false;

    this.$timeout(() => {
      this.canvas = this.$element.find('canvas');
      this.init();

      this.$scope.$watch('terrain', () => {
        console.log("Terrain watch triggered");
        this.needs_update = true;
      }, true);

      this.animate();
    });
  }

  init() {
    this.width = this.canvas.innerWidth();
    this.height = this.canvas.innerHeight();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas.get(0),
      antialias: true,
      preserveDrawingBuffer: true
    });

    this.camera = new THREE.PerspectiveCamera(
      45, this.widht / this.height, 0.1, 100000.0
    );

    this.scene = new THREE.Scene();

    this.scene.add(this.camera);

    this.camera.position.x = 50;
    this.camera.position.y = 50;
    this.camera.position.z = 50;

    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.surface_material = new THREE.MeshPhongMaterial({
      color: 0x2194ce,
      emissive: 0x000000,
      specular: 0x111111,
      shininess: 30,
      side: THREE.DoubleSide
    });

    // this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    this.hemisphereLight = new THREE.HemisphereLight(0xFFFFBB, 0x080800, 1);

    this.scene.add(this.hemisphereLight);

    // this.resize();
  }

  animate() {
    this.animation = requestAnimationFrame(this.animate.bind(this));

    this.update();

    if (this.width !== this.canvas.innerWidth() || this.height !== this.canvas.innerHeight())
      this.resize();

    this.render();
  }

  resize() {
    this.canvas.height(0);
    this.width = angular.element(this.canvas).width();
    this.height = angular.element(this.canvas).height();
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
  }

  update() {
    this.controls.update();

    if (this.needs_update) {
      this.needs_update = false;
      this.update_surface();
    }
  }

  update_surface() {
    console.log("Updating Surface!", `New surface: ${this.$scope.terrain}`);

    let terrain = this.$scope.terrain;
    let data_mat = terrain.height_map;

    if (data_mat === null)
      return;

    if (terrain.normal_map !== null) {
      this.surface_material.normalMap = new THREE.Texture(
        new THREE.DataTexture(
          terrain.normal_map.data,
          terrain.normal_map.cols,
          terrain.normal_map.rows,
          THREE.RGBAFormat));
    }

    let data = data_mat.data;
    let geometry = new THREE.PlaneBufferGeometry(data_mat.cols, data_mat.rows, data_mat.cols - 1, data_mat.rows - 1);
    let vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0; i < vertices.length; ++i, j += 3) {
      vertices[j + 2] = vertices[j + 1];
      vertices[j + 1] = data[i];
    }

    // this.camera.lookAt(new THREE.Vector3(128, 128, 0));

    if (_.has(this, 'plane')) {
      this.plane.geometry = geometry;
      // this.plane = new THREE.Mesh(geometry, this.surface_material);
    } else {
      this.plane = new THREE.Mesh(geometry, this.surface_material);
      this.scene.add(this.plane);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera, null, true);
  }
}

@Inject('$parse', '$timeout')
class TerrainViewer {
  constructor() {
    this.restrict = 'E';
    this.scope = {
      terrain: '='
    };
    this.template = '<canvas flex></canvas>';
    this.controller = TerrainViewerController
  }

  static factory() {
    return new TerrainViewer();
  }
}

TerrainViewer.directive_name = 'terrainViewer';

export default TerrainViewer;