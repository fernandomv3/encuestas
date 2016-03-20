"use strict";
var dataset;
//defining width, height and margins for the chart

var margin = {
  top:80,
  bottom:150,
  left: 75,
  right: 60
}

var options = ['IPSOS', 'DATUM', 'CPI', 'IMA', 'VOX POPULI', 'IDICE', 'CIT'];

var textPadding = 22;

var width = 1336 - margin.left -margin.right;
var height = 768 - margin.top -margin.bottom;

var imgWidth = 200;
var imgHeight = 240;
var imgAR = 200 / 240;

// set top number of candidates
var topN = 5;
var groupOthers = true;

//creating scales for the data
var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .3);
var y = d3.scale.linear()
    .range([height, 0]);

//creating axis for the chart
var xAxis= d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .outerTickSize(0); 

var yAxis= d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(3,"%")
    .outerTickSize(0);


var selectEncuestadoras = d3.select("#encuestadoras");
for(var i =0; i < options.length; i++ ){
  selectEncuestadoras.append("option")
    .attr("value",i)
    .text(options[i]);
}

selectEncuestadoras.on("change",function(){
  var i = +(d3.select(this).node().value);
  update(filterDataBySurveyor(dataset,options[i]));
});

//create and append svg element
var svg = d3.select(".svg-container").append("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 1336 768")
  .classed("svg-content-responsive", true)
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.select("svg")
  .append("g")
  .append("text")
  .attr("class","chart-title")
  .attr("x",(width + margin.left + margin.right)/2)
  .attr("y",margin.top/2)
  .attr("text-anchor", "middle")
  .text("Encuesta Presidencial");

//drawing axes for the first time
svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

svg.append("g")
  .attr("class", "y axis")
  .call(yAxis);

//load data and update when fully loaded
d3.json("data.json",function(d){
  dataset = d;
  update(filterDataBySurveyor(dataset,options[0]));
});

function filterDataBySurveyor(data,surveyor){
  var result = [];
  for(var i = 0; i< data.length; i++){
    if((surveyor in data[i]) && (data[i][surveyor]!= null)){
      var c = {
        "name" : data[i]["Candidato"],
        "partido" : data[i]["partido"],
        "foto_url": data[i]["foto"],
        "perc": parseFloat(data[i][surveyor])/100.0
      };
      result.push(c);
    }
  }
  return result;
}

function posX(d){
  return x(d.name);
}

function posY(d){
  return y(d.perc);
}

function _id(d){
  return d.name;
}
function makeClassName(d){
  return d
    .trim()
    .split(" ")
    .join("-")
    .replace("á","a")
    .replace("é","e")
    .replace("í","i")
    .replace("ó","o")
    .replace("ú","u")
    .toLowerCase();
}

function update(data){
  if (data.length == 0){
    return;
  }
  var selectedData = data.slice().sort(function(d1,d2){
    return d2.perc - d1.perc;
  });

  var topNum = Math.max(Math.min(selectedData.length,topN),1);
  //calculate "Others" category
  var others = 0.0;
  if(groupOthers && topNum < selectedData.length){
    others = selectedData.slice(topNum,selectedData.length).reduce(function(pv,cv,ci,a){
      return pv + cv.perc;
    },0.0);
  }
  
  selectedData = selectedData.slice(0,topNum);
  if (others !== 0.0){
    selectedData.push({"name":"Otros","perc":others});
  }

  //set new domain for the x and y scales
  x.domain(selectedData.map(function(d,i){
    return d.name;
  }));
  y.domain([0,d3.max(selectedData.map(function(d){
    return d.perc;
  }))])

  //draw updated axes
  svg.selectAll(".axis.x")
    .transition()
    .duration(500)
    .call(xAxis);

  svg.selectAll(".axis.y")
    .transition()
    .duration(500)
    .call(yAxis);

  //add and update bars
  var bar = svg.selectAll(".bar")
    .data(selectedData,_id);

  bar.enter()
    .append("rect")
    .attr("class", function(d){
      return "bar " + makeClassName(d.name);
    });

  //update positions
  bar.transition()
    .duration(500)
    .attr("x", posX)
    .attr("y", posY)
    .attr("width", x.rangeBand())
    .attr("height", function(d) { 
      return height - y(d.perc);
    });

  bar.exit().remove();

  //add and update labels
  var label = svg.selectAll(".text-label")
  .data(selectedData,_id);
  label.enter()
    .append("text")
    .attr("class", function(d){
      return "text-label " + makeClassName(d.name);
    });
  label
    .transition()
    .duration(500)
    .attr("x", posX)
    .attr("y", posY)
    .attr("dx", function(d){
      return x.rangeBand()/2;
    })
    .attr("dy", function(d){
      return  textPadding;
    })
    .attr("text-anchor", "middle")
    .text(function(d){
      return d3.round(d.perc *100.0,2) + "%";
    });
  label.exit().remove();

  //add and update images
  var img = svg.selectAll(".img")
    .data(selectedData,_id);
  img.enter()
    .append("image")
    .attr("class", function(d){
      return "img " + makeClassName(d.name);
    })
    .attr("width", x.rangeBand() *0.75)
    .attr("height", x.rangeBand() *0.75 / imgAR)
    .attr("xlink:href",function(d){
      return d.foto_url
    });
  img.transition()
    .duration(500)
    .attr("x", posX)
    .attr("y", 0.20*margin.bottom + height)
    .attr("transform",function(d){
      return "translate("+(x.rangeBand()/2 - (x.rangeBand() *0.75)/2)+",0)";
    });
  img.exit().remove();
}