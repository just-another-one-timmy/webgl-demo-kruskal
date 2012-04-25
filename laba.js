var container;
var camera, scene, renderer, objects;
var controls, clock;

var axisLength = 100;
var nodeRadius = 0.5;

var select;

var nodes = [];
var edges = [];

// number of subset for each node
var colors = [];

var algorithmWorked = false;

var report;

init();
animate();

function init() {
    select = document.getElementById('controls').getElementsByTagName('select')[0];

    container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(-20, 20, -20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 10;
    controls.lookSpeed = 0.02;
    controls.freeze = true;

    scene.add(new THREE.AmbientLight(0x444444));

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    renderer = new THREE.SVGRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);   

    var plane = new THREE.Mesh(new THREE.PlaneGeometry(axisLength * 2, 
                                                       axisLength * 2, 20, 20),
                               new THREE.MeshLambertMaterial({color: 0xdddddd}));
    plane.rotation.x = - 90 * Math.PI / 180;
    plane.position.y = 0;
    plane.position.x = axisLength;
    plane.position.z = axisLength;

    scene.add(plane);

    addAxis(0xff0000, new THREE.Vector3(1, 0, 0).multiplyScalar(axisLength));
    addAxis(0x00ff00, new THREE.Vector3(0, 1, 0).multiplyScalar(axisLength));
    addAxis(0x0000ff, new THREE.Vector3(0, 0, 1).multiplyScalar(axisLength));
}

function addAxis(axisColor, point) {
    addLine(axisColor, new THREE.Vector3(0, 0, 0), point);
}

function addLine(color, point1, point2) {
    var g = new THREE.Geometry();
    g.vertices.push(new THREE.Vertex(point1));
    g.vertices.push(new THREE.Vertex(point2));
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({color: color})));
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
    controls.update(clock.getDelta());
}

function askForName() {
    var f = false, name, i;
    while (!f) {
        f = true;
        var name = window.prompt("Enter node name");
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].name === name) {
                f = false;
            }
        }
        if (!f) {
            alert("This name was already taken!");
        }
    }
    return name;
}

function addNewVertex() {
    var xc = window.prompt("Enter node x coordinate"),
    yc = window.prompt("Enter node y coordinate"),
    zc = window.prompt("Enter node z coordinate");

    var node = createNode(xc, yc, zc, askForName());
    nodes.push(node);

    clearOptions();
    fillOptions();
}

function createNode(x, y, z, name) {
    var res = {name: name};

    var geometry = new THREE.SphereGeometry(nodeRadius, 16, 16);
    var material = new THREE.MeshLambertMaterial({color: 0xffffff * Math.random()});
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    scene.add(mesh);

    res.mesh = mesh;
    return res;
}

function clearOptions() {
    select.options.length = 0;
}

function fillOptions() {
    var i, node;
    for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        select.options[select.options.length] = new Option(
                node.name + "{ "  + 
                node.mesh.position.x + "; " + 
                node.mesh.position.y + "; " + 
                node.mesh.position.z +"}", 
            node.name);
    }
}

function resetCamera() {
    camera.position.set(-20, 20, -20);
    camera.lookAt(scene.position);
}

function findDest(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
}

function mergeForests(node1num, node2num) {
    var root1 = getColor(node1num);
    var root2 = getColor(node2num);
    if (root1 < root2) {
        colors[root2] = root1;
    } else {
        colors[root1] = root2;
    }
}

function getColor(nodenum) {
    var res = colors[nodenum];
    if (res !== nodenum) {
        return getColor(res);
    }
    return res;
}

function connectNodes(node1pos, node2pos) {
    addLine(0, node1pos, node2pos);
}

function runAlgo() {
    if (algorithmWorked) {
        alert(report + "\nF5 для початку нового сеансу");
        return;
    }
    algorithmWorked = true;

    var i, j, edge;
    for (i = 0; i < nodes.length; i++) {
        colors.push(i);
    }

    for (i = 0; i < nodes.length; i++) {
        for (j = i+1; j < nodes.length; j++) {
            edge = {from: i, to: j, dest: findDest(nodes[i].mesh.position,
                                                   nodes[j].mesh.position)};
            edges.push(edge);
        }
    }
    
    edges.sort(
        function(edge1, edge2) {
            if (edge1.dest < edge2.dest) {
                return -1;
            }
            if (edge1.dest > edge2.dest) {
                return +1;
            }
            return 0;
        }
    );

    report = "";
    var color1, color2;
    // идем по возрастанию весов
    for (i = 0; i < edges.length; i++) {
        edge = edges[i];
        color1 = getColor(edge.from);
        color2 = getColor(edge.to);
        if (color1 !== color2) {
            mergeForests(edge.from, edge.to);
            report += 'Додамо до каркасу ребро (' + edge.from + ', ' + edge.to + ')\n';
            connectNodes(nodes[edge.from].mesh.position, nodes[edge.to].mesh.position);
        }
    }  
    alert(report);
}