
import './App.css'
import * as d3 from 'd3'
import { useEffect, useState } from 'react'
import 'primeicons/primeicons.css';

function App() {
  const [ scrollTop, setScrollTop ] = useState(0);



  useEffect(()=>{

    

    const req1 = new XMLHttpRequest();
    req1.open("GET", "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json", true)
    req1.send()

    const req2 = new XMLHttpRequest();
    req2.open("GET", "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json", true)
    req2.send()

    let data={
    };
    req1.onload = () => {
      const data1 = JSON.parse(req1.responseText)
      data = Object.assign({}, data, {
        data1: data1
      })
    }
    req2.onload = () => {
      const data2 = JSON.parse(req2.responseText)
      data = Object.assign({}, data, {
        data2: data2
      })
      if(data.data1.length > 0 && data.data2){return combineData(data)}
    }
    
  },[])

  

  function combineData(data){

    for(let i=0; i<data.data1.length; i++) {
      let fips = data.data1[i].fips;
      let geometries = data.data2.objects.counties.geometries;
      for(let j=0; j<geometries.length; j++){
        let id = geometries[j].id;

        if(fips === id) {
          //console.log(geometries[j], data.data1[i])
          geometries[j] = Object.assign({}, geometries[j], data.data1[i])
          //console.log(geometries[j])
        }
      }
    }
    //console.log("combined", data.data2)
    //console.log("from", data.data2.objects.counties.geometries[0])

    return renderMap(data)
  }

  function renderMap(data) {
    const { data1, data2 } = data;
    const lData = [];
    
    const scale = 0.83;
    const  w = 950;
    const h = 500;
    const geo = data2.objects.counties.geometries
    const ed = geo.map(e=>e.bachelorsOrHigher)
    
    const rgb = [];
    let r = 230;
    let g = 230;
    let b = 230;
    let f = 3.5;
    for (let i=0; i<30*f; i+=f) {
      rgb.push("rgb("+r+","+g+","+b+")")
      r -= Math.ceil(2*f);
      g -= Math.ceil(1*f);
      b -= Math.ceil(2*f);
    }
    for (let i=0; i<rgb.length; i++) {
      lData.push(Object.assign({}, {
        rgb: rgb[i],
        ed: ed[i]
      }))
    }
    console.log(lData)

    const colorScale = d3.scaleQuantize()
      .domain([d3.min(ed) - 0.5, d3.max(ed) + 0.5])
      .range(rgb)

    function mouseoverHandler(e) {
      const atb =  e.srcElement.attributes;
      //const county = atb["data-county"].nodeValue;
      //console.log("atb",atb)
      const state = atb["data-state"].nodeValue;
      const county = atb["data-county"].nodeValue;
      const ed = parseFloat(atb["data-education"].nodeValue);
      

      d3.select("#tooltip")
        .attr("data-education", ed)
        .html(""+county+", "+state+"<br/>Bachealors or higher: <span>"+ed+"%</span>")
        .style("visibility", "visible")
    }
    function mousemoveHandler(e) {
      d3.select("#tooltip")
        .style("top", ( e.clientY - 80 )+"px")
        .style("left", ( e.clientX - 90 )+"px")
    }
    function mouseoutHandler() {
      console.log("mouseout")
      d3.select("#tooltip")
        .html('')
        .style("visibility", "hidden")
    }
    

    d3.select("#map-container").selectAll("svg").remove()
    const map = d3.select("#map-container").append("svg")
      .attr("width", w)
      .attr("height", h)

    let feature = topojson.feature(data2, data2.objects.counties)
    const path = d3.geoPath()
    //console.log("feature",feature)

    const data3 = data2.objects.counties.geometries;
    //console.log(data3)
    
    map.selectAll("path")
      .data(feature.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("transform", `scale(1, 0.83)`)
      .attr("class", "county")
      .attr("data-fips", (d,i)=> data3[i].fips)
      .attr("data-education", (d,i)=> data3[i].bachelorsOrHigher)
      .attr("data-county", (d,i) => data3[i].area_name)
      .attr("data-state", (d, i) => data3[i].state)
      //.attr("stroke","gray")
      .style("fill", (d,i)=> colorScale(data3[i].bachelorsOrHigher))
      .on("mouseover", mouseoverHandler)
      .on("mousemove", mousemoveHandler)
      .on("mouseout", mouseoutHandler)


    const wLgd = 500;
    const hLgd = 100;
    const pLgd = {
      top: 20,
      right: 50,
      bottom: -40,
      left: 40
    };
    const cwLgd = (wLgd / 30);
    const chLgd = 30;
    const lScale = d3.scaleLinear()
      .domain([d3.min(ed), d3.max(ed)])
      .range([pLgd.left, wLgd + pLgd.left])


    d3.select("#legend").selectAll("svg").remove()
    const legend = d3.select("#legend").append("svg")
      .attr("width", wLgd + pLgd.right + pLgd.left)
      .attr("height", hLgd + pLgd.top + pLgd.bottom )
    
    legend
      .selectAll("rect")
      .data(lData)
      .enter()
      .append("rect")
        .attr("fill", (d, i) => d.rgb)
        .attr("class", "legend-cell")
        .attr("width", cwLgd+.6)
        .attr("height", chLgd)
        .attr("x", ( d, i ) => pLgd.left + ( i * cwLgd ) )
        .attr("y", pLgd.top)

    const lAxis = d3.axisBottom(lScale).tickFormat(d=>d+"%")
    legend.append("g")
      .attr("id", "legend-axis")
      .attr("color", "whitesmoke")
      .attr("transform", "translate(0,"+(pLgd.top+chLgd)+")")
      .call(lAxis)

  }

  function handleScrollDown(){
    const h = [window.innerHeight, (window.innerHeight * 0.55)];
    d3.select("#footer-arrow")
      .transition()
      .style("top", () => (h[1] - 20) + "px" )
      .style("opacity", 0)

    d3.select("#footer")
      .transition()
      .style("top", () => h[1]+"px")
  }
  function handleScrollUp(){
    const h = [window.innerHeight, (window.innerHeight * 0.55)];
    d3.select("#footer-arrow")
      .transition()
      .style("top", () => (h[0] - 55) + "px" )
      .style("opacity", 0.8)

    d3.select("#footer")
      .transition()
      .style("top",  () => (h[0]+10)+"px")
  }

  document.addEventListener("wheel", (event) => {

    if (event.deltaY > 0) { handleScrollDown() } 
    else if (event.deltaY < 0) { handleScrollUp() }
  })

  return (
    <div className="App">
      <div id="tooltip"></div>
      <div id="description">
        <h2 id="title">United States Educational Attainment</h2>
        <p>Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)
          <br/>source: <a target="_blank" href="https://www.ers.usda.gov/data-products/county-level-data-sets/county-level-data-sets-download-data/">USDA Economic Research Service</a>
        </p>
      </div>
      <div id="map-container"></div>
      <div id="legend"></div>
      <div id="footer-arrow">
        <i className="pi pi-angle-double-down" onClick={handleScrollDown} style={{"fontSize": "3rem"}}></i>
      </div>
      <footer id="footer">
        <h3>created by</h3>
        <h1><a id="name" target="_blank" href="https://github.com/nathan-zucker">NATHAN ZUCKER</a></h1>
        <p>as part of the <a href="https://www.freecodecamp.org" target="_blank">Free Code Camp</a><br/>Data Visualisation Projects</p>
      </footer>
    </div>
  )
}

export default App
