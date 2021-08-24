import React, { useRef, useEffect } from "react";
import {writeJsonFile} from 'write-json-file';
// import loadJsonFile  from 'load-json-file';
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
import { polygon, point, booleanPointInPolygon, bbox } from '@turf/turf';
import lineclip from 'lineclip';

var pts = point([5, 3.5]);
var pollly = polygon([[
  [1, 1],
  [1, 3.5],
  [4, 3.5],
  [4, 1],
  [1, 1]
]]);

// console.log("BBox of polygon : ", bbox(pollly))

// console.log("Point and Polygon :",pollly, pts);
console.log("Is Point lies in polygon ?", booleanPointInPolygon(point([5, 3.5]), pollly))

var xindex = lineclip.polygon([
  [3, 3],
  [3, 5],
  [5, 5],
  [5, 3],
  [3, 3]
] ,bbox(pollly));

console.log("Clippped Polygon : ", xindex);


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


  const handleMakeCircleHole = () =>{
    // alert("Circle hole is made");
    console.log("First from Multipolygon : ", all_poly[0].id);
    console.log("Second selection : ", all_poly[1].id);

    if(all_poly[0].geometry.type === "MultiPolygon"){

      all_poly[0].geometry.coordinates[0].push(all_poly[1].geometry.coordinates[0]);

   
    Draw.add({
      type: "Feature",
      properties: {
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
            all_poly[0].geometry.coordinates[0]
        ],
      },
    });
    Draw.delete(all_poly[0].id);
    Draw.delete(all_poly[1].id);
  
    }
    if(all_poly[0].geometry.type === "Polygon"){
      // console.log("First from polygon :", all_poly[0].geometry.coordinates)
      // console.log("Second from polygon :", all_poly[1].geometry.coordinates)
      let final_mul = [];
      final_mul.push(all_poly[0].geometry.coordinates[0]);
      final_mul.push(all_poly[1].geometry.coordinates[0]);

      Draw.add({
        id: 990011,
        type: "Feature",
        properties: {
        },
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            final_mul
          ],
        },
      });
      Draw.delete(all_poly[0].id);
      Draw.delete(all_poly[1].id);
      // console.log("Final multipolygon from polygon : ", final_mul);
    }
  }

  //partial hole in polygon mode function
  const handlePartialHoleMode = () =>{
    // alert("Polygon with partial hole..");

    //1.select both polygons
    //2.calculate intersecting polygon's coordinates
    //3.perform 'polygon with hole' with main polygon and
    //intersected polygon
    // console.log("Selected Polygon In hole : ", all_poly[0]);
    // console.log("BBox of Polygon 1 : ", bbox(all_poly[0]));
    // console.log("Second Polygons only coords : ", all_poly[1].geometry.coordinates[0])
    var interesected_poly = lineclip.polygon(all_poly[1].geometry.coordinates[0], bbox(all_poly[0]));
    console.log("The End Output : ", interesected_poly);

    if(all_poly.length === 2){
    var echo_poly1 = []
    var echo_poly2 = []
    var echo_output = []
    var overall_coords = []
    echo_poly1.push(all_poly[0].geometry.coordinates[0]);
    echo_poly2.push(all_poly[1].geometry.coordinates[0]);
    echo_output = polygonClipping.intersection(echo_poly1, echo_poly2);

    if(all_poly[0].geometry.type === "Polygon"){
    
    // Draw.delete(all_poly[1].id);
    // console.log("Experimental Output : ",echo_output);
    overall_coords.push(all_poly[0].geometry.coordinates[0]);
    overall_coords.push(echo_output[0][0]);
    console.log("Multipolygon Output : ",overall_coords);
    Draw.delete(all_poly[0].id);
    Draw.delete(all_poly[1].id);
    
    Draw.add({
      type: 'Feature',
      properties: {},
      geometry: { 
        type: 'MultiPolygon', 
        coordinates: [
          overall_coords
        ] 
      }
    })
  }

  if(all_poly[0].geometry.type === "MultiPolygon"){

    all_poly[0].geometry.coordinates[0].push(echo_output[0][0]);
      
    Draw.add({
      type: "Feature",
      properties: {
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
            all_poly[0].geometry.coordinates[0]
        ],
      },
    });

    Draw.delete(all_poly[0].id);
    Draw.delete(all_poly[1].id);
  }

  }else{
    alert("Polygon cut failed, try selecting 2 two polygons")
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
      //things to load

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


  const handleSaveZones = async () => {
      var savedData = await writeJsonFile('foo.json', {foo: true});
      console.log("Saved Zones : ", savedData);
  }

 

  

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
          // onClick={handlePolygonCut}
          onClick={handleMakeCircleHole}
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
        <button onClick={handlePartialHoleMode}>Partial Hole mode</button>

        <button onClick={handleSaveZones}>Save Zones</button>
    </div>
  );
}

export default App;
