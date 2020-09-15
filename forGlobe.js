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

  const name_country = document.getElementById("country_name");

  const tests_total = document.getElementById("tests-total");
  const confirmed_total = document.getElementById("confirmed-total");
  const deaths_total = document.getElementById("deaths-total");
  const recovered_total = document.getElementById("recovered-total");

  const confirmed_today = document.getElementById("confirmed-today");
  const deaths_today = document.getElementById("deaths-today");

  const confirmed_pmillion = document.getElementById("confirmed-per-million");
  const deaths_pmillion = document.getElementById("deaths-per-million");
  const tests_pmillion = document.getElementById("recovered-per-million");

  let width = document.getElementById("two").clientWidth;
  let height = document.getElementById("two").clientHeight;

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

getData();
