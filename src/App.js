import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import SplitPolygonMode from "mapbox-gl-draw-split-polygon-mode";
import CutPolygonMode from "mapbox-gl-draw-cut-polygon-mode";
import mapboxGlDrawPassingMode from "mapbox-gl-draw-passing-mode";
import { StampMode, TransformMode } from '@nifty10m/mapbox-gl-draw-mode-collection';
import {
  CircleMode,
  DragCircleMode,
  DirectMode,
  SimpleSelectMode,
} from "mapbox-gl-draw-circle";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import polygonClipping from "polygon-clipping";
import StringArray from "string-array";
import {
  Union,
  XCircle,
  LayoutSplit,
  Scissors,
  Circle,
  CaretUpSquareFill
} from "react-bootstrap-icons";
import ReactTooltip from "react-tooltip";
import "./App.css";
import Data from "./field_boundary_has_hole.json"; //shape file data
import { circle } from '@turf/turf';
import lineclip from 'lineclip'; // polygon-clipping

// console.warn("Poly-Clipping Output : ", lineclip.polygon(
//   [[1, 2], [1, 7], [5, 7], [5, 2]], // line
//   [[3, 5], [3, 9], [6, 9], [6, 5]]));


mapboxgl.accessToken =
  "pk.eyJ1IjoibmF2aW5rb2RhbSIsImEiOiJja3F2d3N6ZW8waXAwMm9yeTk3cmlvMjI2In0.tfNR6Rgoed-XiYPfBzy8Hg";

var Draw = new MapboxDraw({
  userProperties: true,
  displayControlsDefault: true,
  modes: {
    ...MapboxDraw.modes,

    //partial splitPolygonMode
    stamp: StampMode,
    transform: TransformMode,

    //draw circle props
    draw_circle: CircleMode,
    drag_circle: DragCircleMode,
    direct_select: DirectMode,
    simple_select: SimpleSelectMode,

    //cut polygon
    cutPolygonMode: CutPolygonMode,
    passing_mode_polygon: mapboxGlDrawPassingMode(
      MapboxDraw.modes.draw_polygon
    ),

    //split polygon by line
    splitPolygonMode: SplitPolygonMode,
    passing_mode_line_string: mapboxGlDrawPassingMode(
      MapboxDraw.modes.draw_line_string
    ),

  },

  styles: [
    {
      id: "gl-draw-polygon-fill-inactive",
      type: "fill",
      filter: [
        "all",
        ["==", "active", "false"],
        ["==", "$type", "Polygon"],
        ["!=", "mode", "static"],
      ],
      paint: {
        "fill-color": [
          "case",
          ["==", ["get", "user_class_id"], 1],
          "#00ff00",
          ["==", ["get", "user_class_id"], 2],
          "#0000ff",
          "#ff0000",
        ],
        "fill-outline-color": "#3bb2d0",
        "fill-opacity": 0.5,
      },
    },
    {
      id: "gl-draw-polygon-fill-active",
      type: "fill",
      filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
      paint: {
        "fill-color": "#fbb03b",
        "fill-outline-color": "#fbb03b",
        "fill-opacity": 0.1,
      },
    },
    {
      id: "gl-draw-polygon-midpoint",
      type: "circle",
      filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
      paint: {
        "circle-radius": 3,
        "circle-color": "#fbb03b",
      },
    },
    {
      id: "gl-draw-polygon-stroke-inactive",
      type: "line",
      filter: [
        "all",
        ["==", "active", "false"],
        ["==", "$type", "Polygon"],
        ["!=", "mode", "static"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#3bb2d0",
        "line-width": 2,
      },
    },
    {
      id: "gl-draw-polygon-stroke-active",
      type: "line",
      filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#fbb03b",
        "line-dasharray": [0.2, 2],
        "line-width": 2,
      },
    },
    {
      id: "gl-draw-line-inactive",
      type: "line",
      filter: [
        "all",
        ["==", "active", "false"],
        ["==", "$type", "LineString"],
        ["!=", "mode", "static"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#3bb2d0",
        "line-width": 2,
      },
    },
    {
      id: "gl-draw-line-active",
      type: "line",
      filter: ["all", ["==", "$type", "LineString"], ["==", "active", "true"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#fbb03b",
        "line-dasharray": [0.2, 2],
        "line-width": 2,
      },
    },
    {
      id: "gl-draw-polygon-and-line-vertex-stroke-inactive",
      type: "circle",
      filter: [
        "all",
        ["==", "meta", "vertex"],
        ["==", "$type", "Point"],
        ["!=", "mode", "static"],
      ],
      paint: {
        "circle-radius": 5,
        "circle-color": "#fff",
      },
    },
    {
      id: "gl-draw-polygon-and-line-vertex-inactive",
      type: "circle",
      filter: [
        "all",
        ["==", "meta", "vertex"],
        ["==", "$type", "Point"],
        ["!=", "mode", "static"],
      ],
      paint: {
        "circle-radius": 3,
        "circle-color": "#fbb03b",
      },
    },
    {
      id: "gl-draw-point-point-stroke-inactive",
      type: "circle",
      filter: [
        "all",
        ["==", "active", "false"],
        ["==", "$type", "Point"],
        ["==", "meta", "feature"],
        ["!=", "mode", "static"],
      ],
      paint: {
        "circle-radius": 5,
        "circle-opacity": 1,
        "circle-color": "#fff",
      },
    },
    {
      id: "gl-draw-point-inactive",
      type: "circle",
      filter: [
        "all",
        ["==", "active", "false"],
        ["==", "$type", "Point"],
        ["==", "meta", "feature"],
        ["!=", "mode", "static"],
      ],
      paint: {
        "circle-radius": 3,
        "circle-color": "#3bb2d0",
      },
    },
    {
      id: "gl-draw-point-stroke-active",
      type: "circle",
      filter: [
        "all",
        ["==", "$type", "Point"],
        ["==", "active", "true"],
        ["!=", "meta", "midpoint"],
      ],
      paint: {
        "circle-radius": 7,
        "circle-color": "#fff",
      },
    },
    {
      id: "gl-draw-point-active",
      type: "circle",
      filter: [
        "all",
        ["==", "$type", "Point"],
        ["!=", "meta", "midpoint"],
        ["==", "active", "true"],
      ],
      paint: {
        "circle-radius": 5,
        "circle-color": "#fbb03b",
      },
    },
    {
      id: "gl-draw-polygon-fill-static",
      type: "fill",
      filter: ["all", ["==", "mode", "static"], ["==", "$type", "Polygon"]],
      paint: {
        "fill-color": "#404040",
        "fill-outline-color": "#404040",
        "fill-opacity": 0.1,
      },
    },
    {
      id: "gl-draw-polygon-stroke-static",
      type: "line",
      filter: ["all", ["==", "mode", "static"], ["==", "$type", "Polygon"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#404040",
        "line-width": 2,
      },
    },
    {
      id: "gl-draw-line-static",
      type: "line",
      filter: ["all", ["==", "mode", "static"], ["==", "$type", "LineString"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#404040",
        "line-width": 2,
      },
    },
    {
      id: "gl-draw-point-static",
      type: "circle",
      filter: ["all", ["==", "mode", "static"], ["==", "$type", "Point"]],
      paint: {
        "circle-radius": 5,
        "circle-color": "#404040",
      },
    },
  ],
});

var all_poly = []; // selected polygon list to be merged
var selected_polygons = [];

function ConvertShapeFile(Data) {
  const new_data = Array.from(Data.props[0].the_geom);
  let converted_data = "";

  for (let i = 0; i < new_data.length; i++) {
    switch (new_data[i]) {
      case "(":
        converted_data += "[";
        break;

      case ")":
        converted_data += "]";
        break;

      case " ":
        converted_data += ",";
        break;
      case ",":
        converted_data += "";
        break;

      default:
        converted_data += new_data[i];
    }
  }

  converted_data = StringArray.parse(converted_data);
  // console.log("Final Data: ", typeof (converted_data));
  // console.log("COnverted: ", converted_data);
  return converted_data;
}

function generateData(the_array) {
  // console.log("The_Arrray Length: ", the_array.length);
  const the_main = [];
  for (let k = 0; k < the_array.length; k++) {
    var _2d_array = [];
    var s_array = [];
    for (let i = 0; i < the_array[k][0].length; i += 1) {
      if (i % 2 !== 0) {
        s_array.push(parseFloat(the_array[0][0][i])); //changing coordinate type to float
        _2d_array.push(s_array);
        s_array = [];
        continue;
      } else {
        s_array.push(parseFloat(the_array[0][0][i])); //changing coordinate type to float
      }
    }
    the_main.push(_2d_array);
    _2d_array = [];
    // console.log(`Final 2D Array Data:`, _2d_array);
    //Before making it worst.. 😆
  }
  // console.log("Doubled _2d_array : ", the_main);
  return the_main;
}

// Generating polygon by giving radius and center of circle
// console.log("Artificial Circle :", circle([-71.84631956040934, 43.53890443178008], 4, {units: 'kilometers'})); 

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const x_data = ConvertShapeFile(Data);
  // console.log("App Shape Data: ", x_data.array[1]);
  const output_shape = generateData(x_data.array);
  console.log("Shape File to 2D array : ", output_shape);
  // Draw Controls function implementation
  function updateArea(e) {
    var data = Draw.getAll();
    console.log("Drawn Data: ", data.features);
  }

  ///polygon cut feature
  function handlePolygonCut() {
    const cut_poly1 = [];
    const cut_poly2 = [];
    //var combine_poly=[];
    if (all_poly.length === 0) {
      alert("Try selecting polygons");
      return false;
    }
    var split_output = [];
    if (all_poly.length <= 2) {
      cut_poly1.push(all_poly[0].geometry.coordinates[0]);
      cut_poly2.push(all_poly[1].geometry.coordinates[0]);
      split_output = polygonClipping.difference(cut_poly1, cut_poly2);
      console.log("Split O/P: ", split_output);

      if (split_output.length === 1) {
        Draw.delete(all_poly[0].id);
        Draw.delete(all_poly[1].id);

        Draw.add({
          id: "poly-3355567",
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: split_output[0],
          },
        });
      } else {
        alert("Split failed!!");
      }
    } else {
      alert("Split failed, try selecting polygon!!");
    }
    // all_poly=[];
    all_poly.length = 0;
  }

  function handleMerge() {
    const poly1 = [];
    const poly2 = [];
    //var combine_poly=[];
    if (all_poly.length === 0) {
      alert("Try selecting polygons");
      return false;
    }
    var the_output = [];
    if (all_poly.length <= 2) {
      poly1.push(all_poly[0].geometry.coordinates[0]);
      poly2.push(all_poly[1].geometry.coordinates[0]);
      the_output = polygonClipping.union(poly1, poly2);
      // console.log("Merge O/P: ", the_output);

      if (the_output.length === 1) {
        Draw.delete(all_poly[0].id);
        Draw.delete(all_poly[1].id);

        Draw.add({
          id: "poly-33555",
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: the_output[0],
          },
        });
      } else {
        alert("Merge failed!!");
      }
    } else {
      alert("Merge failed, try selecting polygon!!");
    }
    // all_poly=[];
    all_poly.length = 0;
  }

  function SelectedArea(e) {
    var response = Draw.getSelected();
    if (Object.keys(response).length === 0) {
      alert("Please select Polygon");
    } else {
      if (all_poly.length === 0) {
        if (response.features[0] !== undefined) {
          all_poly.push(response.features[0]);
        }
      } else {
        //const all_poly = all_poly.filter(item.id[0]);
        var flag = 1;
        if (response.features[0] !== undefined) {
          //console.log(response.features[0].id);
          all_poly.forEach((entry) => {
            if (entry.id === response.features[0].id) {
              flag = 0;
            }
          });
          if (flag === 1) {
            all_poly.push(response.features[0]);
          }
          //all_poly.filter(item => item.id!=response.id);
        }
      }
      console.log("Selected polygons: ", all_poly);
    }
  }

  //split function for polygon..
  const splitPolygon = () => {
    try {
      Draw?.changeMode("splitPolygonMode");
      var data = Draw.getAll();
      console.log("Split Drawn Data: ", data.features);
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  const drawCircle = () => {
    try {
      // Provide the default radius as an option to CircleMode
      Draw.changeMode("draw_circle", { initialRadiusInKm: 0.3 });
      var data = Draw.getAll();
      console.log("After Circle Drawn Data: ", data.features);
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  const cutPolygon = () => {
    try {
      // Provide the default radius as an option to CircleMode
      Draw.changeMode("cutPolygonMode");
      var data = Draw.getAll();
      console.log("After Circle Drawn Data: ", data.features);
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  }

  var geoJSON = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          class_id: 1,
        },
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [-94.90362874880041, 41.07845813934523],
                [-89.96347360931735, 41.24151786613507],
                [-89.63344236826659, 38.913887589263084],
                [-94.87268831995179, 38.567982111611485],
                [-94.90362874880041, 41.07845813934523]
              ],

              [
                [-93.91353502564723, 40.89940363505775],
                [-94.6251648891636, 40.312156270902705],
                [-92.09836319986692, 40.2413437305822],
                [-93.91353502564723, 40.89940363505775]
              ],

              [
                [-91.05739089251821, 40.062861428141076],
                [-91.12258562528538, 40.06039192895756],
                [-91.187138519926, 40.053007747964074],
                [-91.25041447457211, 40.040781579292556],
                [-91.31179177208251, 40.02383373138884],
                [-91.37066855479998, 40.002330866025815],
                [-91.42646904334828, 39.97648425600871],
                [-91.47864942255075, 39.946547584058216],
                [-91.5267033243484, 39.912814310951134],
                [-91.57016684561074, 39.875614646012004],
                [-91.60862304768627, 39.83531215740389],
                [-91.6417058941338, 39.79230006330086],
                [-91.6691035930028, 39.74699724790706],
                [-91.69056131999838, 39.699844048405],
                [-91.70588330859852, 39.651297860283364],
                [-91.71493430244819, 39.60182860914231],
                [-91.71764037393544, 39.55191413705047],
                [-91.71398912060519, 39.50203555089624],
                [-91.7040292578757, 39.452672579003305],
                [-91.68786963233366, 39.40429898064564],
                [-91.6656776846743, 39.35737805107657],
                [-91.63767739514813, 39.312358262354344],
                [-91.60414674722772, 39.26966907767825],
                [-91.56541474719877, 39.229716974205765],
                [-91.52185803860944, 39.19288170646464],
                [-91.47389715109443, 39.15951283955029],
                [-91.42199242314547, 39.129926578350236],
                [-91.36663963804833, 39.104402916095346],
                [-91.3083654115674, 39.08318312262347],
                [-91.24772236914144, 39.066467589872296],
                [-91.18528414945894, 39.05441404930003],
                [-91.12164027039806, 39.047136173169484],
                [-91.05739089251821, 39.04470256891832],
                [-90.99314151463837, 39.047136173169484],
                [-90.92949763557749, 39.05441404930003],
                [-90.86705941589499, 39.066467589872296],
                [-90.80641637346905, 39.08318312262347],
                [-90.74814214698812, 39.104402916095346],
                [-90.69278936189096, 39.129926578350236],
                [-90.64088463394201, 39.15951283955029],
                [-90.592923746427, 39.19288170646464],
                [-90.54936703783767, 39.229716974205765],
                [-90.51063503780873, 39.26966907767825],
                [-90.47710438988831, 39.312358262354344],
                [-90.44910410036213, 39.35737805107657],
                [-90.42691215270277, 39.40429898064564],
                [-90.41075252716072, 39.45267257900329],
                [-90.40079266443125, 39.50203555089624],
                [-90.397141411101, 39.55191413705047],
                [-90.39984748258826, 39.60182860914231],
                [-90.40889847643793, 39.651297860283364],
                [-90.42422046503806, 39.699844048405],
                [-90.44567819203363, 39.74699724790706],
                [-90.47307589090262, 39.79230006330086],
                [-90.50615873735015, 39.83531215740389],
                [-90.5446149394257, 39.875614646012004],
                [-90.58807846068804, 39.912814310951134],
                [-90.6361323624857, 39.946547584058216],
                [-90.68831274168816, 39.97648425600871],
                [-90.74411323023645, 40.002330866025815],
                [-90.8029900129539, 40.02383373138884],
                [-90.8643673104643, 40.040781579292556],
                [-90.92764326511043, 40.053007747964074],
                [-90.99219615975106, 40.06039192895756],
                [-91.05739089251821, 40.062861428141076]

              ]
            ],
          ],
        },
      },
    ],
  };

  const handleMakeCircle = () =>{
    
  }



  {/* Activate the stamp mode with a base feature collection that should be stamped/split with a hand drawn polygon */}

  const handleStampMode = () =>{
    try {
      // Provide the default radius as an option to CircleMode
      Draw.changeMode("stamp", {
        baseFeatureCollection: geoJSON
      });
     
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  }

  const handleTransferMode = () =>{
    try {
      // Provide the default radius as an option to CircleMode
      var featureIds = Draw.set(geoJSON);
      Draw.changeMode('transform', {
          featureIds: featureIds,
});
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  }
        



  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v11",
      center: [-94.90362874880041, 41.07845813934523],
      zoom: 9,
      interactive: true,
      hash: true,
      attributionControl: true,
    });



    // Add navigation control (the +/- zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    //Draw Controls Box
    map.current.addControl(Draw, "top-left");

    map.current.on("load", () =>{
      Draw.set(geoJSON);
    });

   
    //Draw Controls Functions
    map.current.on("draw.create", updateArea);
    map.current.on("draw.delete", updateArea);
    map.current.on("draw.update", updateArea);
    map.current.on("click", SelectedArea);

    // Clean up on unmount
    return () => map.current.remove();
  }, [map]);


  const clearSelection = () => {
    all_poly = [];
    // console.log("Selection cleared...", all_poly);
  };

 

  

  return (
    <div className="App">
      <div ref={mapContainer} className="map-container" />

      {/* The Control box tooltips */}
    <ReactTooltip id="circleTip" place="right" effect="solid">
      Circle tool
    </ReactTooltip>

    <ReactTooltip id="cutTip" place="right" effect="solid">
      Cut Polygon tool
    </ReactTooltip>

    <ReactTooltip id="splitTip" place="right" effect="solid">
      Split through
    </ReactTooltip>

    <ReactTooltip id="mergeTip" place="right" effect="solid">
      Merge tool
    </ReactTooltip>

    <ReactTooltip id="clearTip" place="right" effect="solid">
      Clear selection
    </ReactTooltip>

    <ReactTooltip id="holeTip" place="right" effect="solid">
      Polygon with hole
    </ReactTooltip>

      <div className="app__iconContainer">
        <Circle
          color="black"
          className="circle__icon"
          size={17}
          onClick={drawCircle}
          data-tip data-for="circleTip"
        />
{/* CaretUpSquareFill */}
        <Scissors
          color="black"
          className="scissors__icon" 
          size={17}
          onClick={cutPolygon}
          data-tip data-for="cutTip"
        />

        <LayoutSplit
          color="black"
          className="split__icon"
          size={17}
          onClick={splitPolygon}
          data-tip data-for="splitTip"
        />
        
        <CaretUpSquareFill
          color="black"
          className="split__icon"
          size={17}
          onClick={handlePolygonCut}
          data-tip data-for="holeTip"
        />

        <Union
          color="black"
          className="union__icon"
          size={17}
          onClick={handleMerge}
          data-tip data-for="mergeTip"
        />

        <XCircle
          color="black"
          className="clear__icon"
          size={17}
          onClick={clearSelection}
          data-tip data-for="clearTip"
        />

      </div>

      {/* <button onClick={handleCutBoundary}>Cut Boundary</button> */}
      {/* <button onClick={handleStampMode}>Stamp Mode</button>
      <button onClick={handleTransferMode}>Transfer Mode</button> */}
      <button onClick={handleMakeCircle}>Make Hole as Circle</button>

    </div>
  );
}

export default App;
