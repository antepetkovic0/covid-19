//radio buttons
const rbc = document.getElementById("rb_c");
const rbd = document.getElementById("rb_d");
const rbr = document.getElementById("rb_r");

const toggleButton = document.getElementById("toggle-button");

const createMap = (data, world, country_case) => {
  // let width = document.getElementById("one").offsetWidth;
  // let height = document.getElementById("one").offsetHeight;
  let width = 1000;
  let height = 500;
  let centered;
  const apiData = data;

  const legendText = [
    "> 500 000",
    "100 000 - 500 000",
    "10 000 - 100 000",
    "1 000 - 10 000",
    "< 1 000",
    "unavailable data",
  ];

  //remove svg if its already created
  d3.select("#world-map").select("svg").remove();
  const svg = d3
    .select("#world-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3.geoEquirectangular();
  const path = d3.geoPath().projection(projection);
  //g is used to group svg shapes together
  const map = svg.append("g");

  //creating empty map - ocean
  map
    .append("path")
    .datum({ type: "Sphere" })
    .attr("class", "mapOcean")
    .attr("d", path);

  //filling out map with countries
  map
    .selectAll("country")
    .data(topojson.feature(world, world.objects.countries).features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "country")
    .attr("fill", colorCountry)
    .on("click", zoomToCountry)
    .append("title")
    .text((d) => {
      return `${d.properties.name}`;
    });

  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(-70,210)`);

  //legend colors
  const color = d3.scaleOrdinal().domain(legendText).range(d3.schemeSet1);

  //add dots in legend
  const size = 20;
  legend
    .selectAll("mydots")
    .data(legendText)
    .enter()
    .append("rect")
    .attr("x", 100)
    .attr("y", (d, i) => {
      return 100 + i * (size + 5);
    })
    .attr("width", size)
    .attr("height", size)
    .style("fill", function (d) {
      return color(d);
    });

  //add labels for dots in legend
  legend
    .selectAll("mylabels")
    .data(legendText)
    .enter()
    .append("text")
    .attr("x", 100 + size * 1.2)
    .attr("y", function (d, i) {
      return 100 + i * (size + 5) + size / 2;
    })
    .style("fill", function (d) {
      return color(d);
    })
    .text(function (d) {
      return d;
    })
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle");

  function colorCountry(d) {
    //country name = d.properties.name
    //filter country object
    const c = apiData.find((x) => x.country === d.properties.name);
    const c_case = country_case;

    if (c_case === "confirmed") {
      if (c) {
        const color =
          c.cases < 1000
            ? "#ff7f00"
            : c.cases < 10000
            ? "#984ea3"
            : c.cases < 100000
            ? "#4daf4a"
            : c.cases < 500000
            ? "#377eb8"
            : "#e41a1c";
        return color;
      } else {
        //countries not found in API
        return "#e6e075";
      }
    } else if (c_case === "deaths") {
      if (c) {
        const color =
          c.deaths < 1000
            ? "#ff7f00"
            : c.deaths < 10000
            ? "#984ea3"
            : c.deaths < 100000
            ? "#4daf4a"
            : c.deaths < 500000
            ? "#377eb8"
            : "#e41a1c";
        return color;
      } else {
        //countries not found in API
        return "#e6e075";
      }
    } else {
      if (c) {
        const color =
          c.recovered < 1000
            ? "#ff7f00"
            : c.recovered < 10000
            ? "#984ea3"
            : c.recovered < 100000
            ? "#4daf4a"
            : c.recovered < 500000
            ? "#377eb8"
            : "#e41a1c";
        return color;
      } else {
        //countries not found in API
        return "#e6e075";
      }
    }
  }

  function zoomToCountry(d) {
    let x, y, k;
    if (d && centered !== d) {
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

    map.selectAll("path").classed(
      "active",
      centered &&
        function (d) {
          return d === centered;
        }
    );

    map
      .transition()
      .duration(750)
      .attr(
        "transform",
        "translate(" +
          width / 2 +
          "," +
          height / 2 +
          ")scale(" +
          k +
          ")translate(" +
          -x +
          "," +
          -y +
          ")"
      )
      .style("stroke-width", 1.5 / k + "px");
  }
};

const createGlobe = (res, world) => {
  const name_country = document.getElementById("country_name");

  const tests_total = document.getElementById("tests-total");
  const confirmed_total = document.getElementById("confirmed-total");
  const deaths_total = document.getElementById("deaths-total");
  const recovered_total = document.getElementById("recovered-total");

  const confirmed_today = document.getElementById("confirmed-today");
  const deaths_today = document.getElementById("deaths-today");

  const confirmed_pmillion = document.getElementById("confirmed-per-million");
  const deaths_pmillion = document.getElementById("deaths-per-million");
  const tests_pmillion = document.getElementById("tests-per-million");

  let width = document.getElementById("two").clientWidth;
  let height = document.getElementById("two").clientHeight;

  d3.select("#two").select("svg").remove();
  const svg = d3
    .select("#two")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3
    .geoOrthographic()
    .scale(250)
    .center([0, 0])
    .rotate([0, -30])
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  const sensitivity = 75;
  const initialScale = projection.scale();

  let globe = svg
    .append("circle")
    .attr("fill", "rgb(63, 136, 232)")
    .attr("stroke", "#000")
    .attr("stroke-width", "0.3")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", initialScale);

  // const graticule = d3.geoGraticule();
  // let globe = svg
  //   .append('path')
  //   .datum(graticule)
  //   .attr('class', 'graticule')
  //   .attr('d', path)
  //   .style('fill', 'rgb(63, 136, 232)')
  //   .style('stroke', '#ccc');

  d3.timer(function (elapsed) {
    const rotate = projection.rotate();
    const k = sensitivity / projection.scale();
    projection.rotate([rotate[0] - 1 * k, rotate[1]]);
    svg.selectAll("path").attr("d", path);
  }, 200);

  svg.call(
    d3.drag().on("drag", () => {
      const rotate = projection.rotate();
      const k = sensitivity / projection.scale();
      projection.rotate([
        rotate[0] + d3.event.dx * k,
        rotate[1] - d3.event.dy * k,
      ]);
      path = d3.geoPath().projection(projection);
      svg.selectAll("path").attr("d", path);
    })
  );

  svg.call(
    d3.zoom().on("zoom", () => {
      if (d3.event.transform.k > 0.3) {
        projection.scale(initialScale * d3.event.transform.k);
        svg.selectAll("path").attr("d", path);
        globe.attr("r", projection.scale());
      } else {
        d3.event.transform.k = 0.3;
      }
    })
  );

  const globeMap = svg.append("g");
  globeMap
    .selectAll("path")
    .data(topojson.feature(world, world.objects.countries).features)
    .enter()
    .append("path")
    .attr("d", path)
    .on("click", showCountryData)
    .append("title")
    .text((d) => {
      return d.properties.name;
    });

  //default world cases
  const country = res.find((x) => x.country === "World");
  name_country.innerHTML = "World";

  tests_total.innerHTML = Number(country.totalTests).toLocaleString();

  confirmed_total.innerHTML = Number(country.cases).toLocaleString();
  deaths_total.innerHTML = Number(country.deaths).toLocaleString();
  recovered_total.innerHTML = Number(country.recovered).toLocaleString();

  confirmed_today.innerHTML = Number(country.todayCases).toLocaleString();
  deaths_today.innerHTML = Number(country.todayDeaths).toLocaleString();

  confirmed_pmillion.innerHTML = Number(
    country.casesPerOneMillion
  ).toLocaleString();
  deaths_pmillion.innerHTML = Number(
    country.deathsPerOneMillion
  ).toLocaleString();
  tests_pmillion.innerHTML = Number(
    country.testsPerOneMillion
  ).toLocaleString();

  function showCountryData(d) {
    document.getElementById("one").style.visibility = "visible";

    const country = res.find((x) => x.country === d.properties.name);

    if (country) {
      name_country.innerHTML = d.properties.name;

      tests_total.innerHTML = Number(country.totalTests).toLocaleString();

      confirmed_total.innerHTML = Number(country.cases).toLocaleString();
      deaths_total.innerHTML = Number(country.deaths).toLocaleString();
      recovered_total.innerHTML = Number(country.recovered).toLocaleString();

      confirmed_today.innerHTML = Number(country.todayCases).toLocaleString();
      deaths_today.innerHTML = Number(country.todayDeaths).toLocaleString();

      confirmed_pmillion.innerHTML = Number(
        country.casesPerOneMillion
      ).toLocaleString();
      deaths_pmillion.innerHTML = Number(
        country.deathsPerOneMillion
      ).toLocaleString();
      tests_pmillion.innerHTML = Number(
        country.testsPerOneMillion
      ).toLocaleString();
    } else {
      name_country.innerHTML = d.properties.name;
      confirmed_country.innerHTML = "unavailable data";
      deaths_country.innerHTML = "unavailable data";
      recovered_country.innerHTML = "unavailable data";
    }
  }
};

const getWorld = async () => {
  const response = await d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
  );
  return response;
};

const getData = async () => {
  const response = await fetch(
    "https://coronavirus-19-api.herokuapp.com/countries"
  );
  const res = await response.json();
  const world = await getWorld();
  //createGlobe(res, world);
  createMap(res, world, "confirmed");

  //cases for creating map
  rbc.addEventListener("click", getConfirmedData);
  rbd.addEventListener("click", getDeathsData);
  rbr.addEventListener("click", getRecoveredData);
  toggleButton.addEventListener("click", switchCases);

  const mapContainer = document.getElementById("map-container");
  const globeContainer = document.getElementById("globe-container");

  function switchCases() {
    //flag for event handler of switching button
    let toggleFlag = toggleButton.classList.toggle("active");
    updateMap(toggleFlag);
  }

  function updateMap(isMapShowed) {
    if (isMapShowed) {
      mapContainer.style.display = "none";
      globeContainer.style.display = "flex";
      createGlobe(res, world);
    } else {
      globeContainer.style.display = "none";
      mapContainer.style.display = "flex";
      createMap(res, world, "confirmed");
    }
  }

  function getConfirmedData() {
    createMap(res, world, "confirmed");
  }

  function getDeathsData() {
    createMap(res, world, "deaths");
  }

  function getRecoveredData() {
    createMap(res, world, "recovered");
  }
};

getData();
