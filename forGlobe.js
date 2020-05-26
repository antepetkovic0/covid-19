const getWorld = async () => {
  const response = await d3.json(
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
  );
  return response;
};

const getData = async () => {
  const response = await fetch(
    'https://coronavirus-tracker-api.herokuapp.com/all'
  );
  const res = await response.json();
  const world = await getWorld();

  let width = document.getElementById('two').clientWidth;
  let height = document.getElementById('two').clientHeight;

  const svg = d3
    .select('#two')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

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
    .append('circle')
    .attr('fill', 'rgb(63, 136, 232)')
    .attr('stroke', '#000')
    .attr('stroke-width', '0.3')
    .attr('cx', width / 2)
    .attr('cy', height / 2)
    .attr('r', initialScale);

  // const graticule = d3.geoGraticule();
  // let globe = svg
  //   .append('path')
  //   .datum(graticule)
  //   .attr('class', 'graticule')
  //   .attr('d', path)
  //   .style('fill', 'rgb(63, 136, 232)')
  //   .style('stroke', '#ccc');

  d3.timer(function(elapsed) {
    const rotate = projection.rotate();
    const k = sensitivity / projection.scale();
    projection.rotate([rotate[0] - 1 * k, rotate[1]]);
    svg.selectAll('path').attr('d', path);
  }, 200);

  svg.call(
    d3.drag().on('drag', () => {
      const rotate = projection.rotate();
      const k = sensitivity / projection.scale();
      projection.rotate([
        rotate[0] + d3.event.dx * k,
        rotate[1] - d3.event.dy * k
      ]);
      path = d3.geoPath().projection(projection);
      svg.selectAll('path').attr('d', path);
    })
  );

  svg.call(
    d3.zoom().on('zoom', () => {
      if (d3.event.transform.k > 0.3) {
        projection.scale(initialScale * d3.event.transform.k);
        svg.selectAll('path').attr('d', path);
        globe.attr('r', projection.scale());
      } else {
        d3.event.transform.k = 0.3;
      }
    })
  );

  const globeMap = svg.append('g');

  globeMap
    .selectAll('path')
    .data(topojson.feature(world, world.objects.countries).features)
    .enter()
    .append('path')
    .attr('d', path)
    .on('click', showCountryData)
    .append('title')
    .text(d => {
      return d.properties.name;
    });

  function showCountryData(d) {
    document.getElementById('one').style.visibility = 'visible';
    const name_country = document.getElementById('country_name');
    const confirmed_country = document.getElementById('country_confirmed');
    const deaths_country = document.getElementById('country_deaths');
    const recovered_country = document.getElementById('country_recovered');

    const cConfirmed = res.confirmed.locations.find(
      x => x.country === d.properties.name
    );

    if (cConfirmed) {
      name_country.innerHTML = d.properties.name;
      confirmed_country.innerHTML = Number(cConfirmed.latest).toLocaleString();

      const cDeaths = res.deaths.locations.find(
        x => x.country === d.properties.name
      );
      deaths_country.innerHTML = Number(cDeaths.latest).toLocaleString();

      const cRecovered = res.recovered.locations.find(
        x => x.country === d.properties.name
      );
      recovered_country.innerHTML = Number(cRecovered.latest).toLocaleString();
    } else {
      name_country.innerHTML = d.properties.name;
      confirmed_country.innerHTML = 'unavailable data';
      deaths_country.innerHTML = 'unavailable data';
      recovered_country.innerHTML = 'unavailable data';
    }
  }
};

getData();
