import React, {useEffect,useLayoutEffect,useState,useRef} from 'react';
import styled from 'styled-components'
import ClipLoader from "react-spinners/ClipLoader";
import * as THREE from 'three'
import SpriteText from 'three-spritetext'
import ThreeForceGraph from 'three-forcegraph';
import CameraControls from 'camera-controls';
import gsap from 'gsap'
// import TrackballControls from 'three-trackballcontrols'
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
 
THREE.Cache.enabled = true;
CameraControls.install({ THREE: THREE });

//constructor
let graph, scene, renderer, camera, cameraControls, zoomControls, light, raycaster, pointer, clock, hoveredNode, rotateCycle
let nodeMaterials = {}
const warmupTicks = 20

// const linkMaterial = new MeshLineMaterial({
//             opacity: 0.5,
//             transparent:true,
//             color: '#000000',
//         });

function UniverseBrowser(props) {
    const [loading, setLoading] = useState(false)
    const [rotating, setRotating] = useState(false)
    const universeRef = useRef(null)
    
     // update graph
    useEffect(() => {
        setLoading(true)
        setTimeout(() => {
            nodeMaterials = {}
            graph.clear()
            graph.graphData(props.graphData);
            updateCamera()    
        },200)
    }, [props.graphData])

    // update camera and renderer on resize
    useEffect(() => {
        renderer.setSize(props.width, props.height);
        camera.aspect = props.width / props.height;
        updateCamera()
        // for the effect
        rotateWorld()
    }, [props.width, props.height])

    // initialize graph with config
    useLayoutEffect(() => {

        raycaster = new THREE.Raycaster();
        pointer = new THREE.Vector2();
        clock = new THREE.Clock();

        graph = new ThreeForceGraph()
                .nodeThreeObject(nodeObject)
                .nodeResolution(20)
                // .nodeRelSize(20)
                .linkThreeObject(linkObject)
                .linkResolution(20)
            
                // .linkMaterial(linkMaterial)
                .d3VelocityDecay(0.05)
                .onFinishUpdate(() => {
                        for (let i = 0; i < warmupTicks; i++){
                            graph.tickFrame();
                            console.log('i', i)
                            // end with a animation request
                            if (i === (warmupTicks - 1)) {
                                refreshGraph()
                            }
                        }
                })
            // .d3Force('links', (e, d, f) => {
            //     console.log('e',e,d,f)
            //     return 10000
            // })
        
        clock = new THREE.Clock();
        light = new THREE.AmbientLight(0xbbbbbb)
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f1f1);
        scene.fog = new THREE.Fog(0xf1f1f1, 0, 10000); 
        scene.add(light);
        scene.add(graph);

        renderer = new THREE.WebGLRenderer()
        renderer.parameters = {
            stencil: false,
            powerPreference: 'high-performance',
            precision: 'lowp',
            // logarithmicDepthBuffer: true
        }

        renderer.setSize(props.width, props.height);
        renderer.setPixelRatio(window.devicePixelRatio);

        universeRef.current.appendChild(renderer.domElement);
        universeRef.current.addEventListener('wheel', (event) => {
            if (event.deltaY > 0) {
                dollyOut()
            } else {
                dollyIn()
            }
        });
        
        camera = new THREE.PerspectiveCamera( 60, props.width / props.height, 0.01, 100000 );
        camera.position.set(0, 0, 5);
        
        cameraControls = new CameraControls(camera, renderer.domElement);
        cameraControls.minDistance = -Infinity//30000
        cameraControls.maxDistance = Infinity//30000
        cameraControls.enableTransition = true
        cameraControls.dollySpeed = 0.2 // default is 1
        cameraControls.dampingFactor = 0.1
        cameraControls.infinityDolly = true
        cameraControls.enableDamping = true

        // replace wheel action for smooth zoom transitions
        cameraControls.mouseButtons.wheel = 0
        
        renderer.render( scene, camera );
        animate()
    }, [])

    const dollyIn = () => {
        let dollyStep = 40
        const distance = cameraControls.distance 
        if (distance > 3000) dollyStep = 140
        
        cameraControls.dolly(dollyStep, true);
    }
    const dollyOut = () => {
        let dollyStep = -40
        const distance = cameraControls.distance 
        if (distance > 3000) dollyStep = -140
        cameraControls.dolly(dollyStep, true);
    }

    function animate() {    
        // Frame cycle
        const delta = clock.getDelta();
        const hasControlsUpdated = cameraControls.update(delta);

        if (hasControlsUpdated) {
            renderer.render(scene, camera);  
        } 
        
        requestAnimationFrame(animate);
    }

    function animateFrame() {    
        // Frame cycle
        const delta = clock.getDelta();
        cameraControls.update(delta);
        cameraControls.distance =  cameraControls.distance + 10
        requestAnimationFrame(() => console.log("animate frame"));
        renderer.render(scene, camera);       
    }
    
    function centerCamera(distance = 4000) {
        cameraControls.distance = distance
        cameraControls.setTarget( 0, 0, 0, false )
        requestAnimationFrame(() => console.log('centerCamera'))
        renderer.render(scene, camera);
        setTimeout(() => {
            rotateWorld()
        }, 500)            
    }


    function rotateWorld() {
        if (rotating) return 

        rotateCycle = gsap.to(
            cameraControls,
            {
                azimuthAngle: cameraControls.azimuthAngle + 360 * THREE.MathUtils.DEG2RAD,
                duration: 280,
                // https://greensock.com/ease-visualizer/
                ease: 'power',
                overwrite:true,
                paused: true
            },
        );
    
        rotateCycle.play(0);
        
        rotateCycle.eventCallback('onComplete', (e) => {
            setRotating(false)
        })

        setRotating(true)
    }
    

    function onPointerMove( event ) {
        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components

        const w = props.width
        const h = props.height
        pointer.x = ( (event.clientX - props.xOffset) / w ) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        
        // set camera offset
        const mouseX = event.clientX - props.xOffset
        const mouseY = event.clientY
        const xCenter = w/2
        const yCenter = h / 2
        const dampening = 60
        const xOff = (mouseX - xCenter) / dampening
        const yOff = (mouseY - yCenter) / dampening

        cameraControls.setFocalOffset(xOff,yOff,0,true)
    }


    function detectPointer() {
        let hoveredObject = getHoveredObject()
        props.onNodeHovered(hoveredObject)
    }

    function detectPointerClickDown() {
        if (rotating) {
            rotateCycle.kill()
            setRotating(false)
        }

        let hoveredObject = getHoveredObject()
        hoveredNode = hoveredObject
    }

    function detectPointerClick() {
        let hoveredObject = getHoveredObject()

        if (hoveredNode && hoveredObject
            && hoveredObject.id === hoveredNode.id) {
            props.onNodeClicked(hoveredObject)
        }

        hoveredNode = null
    }

    function getHoveredObject() {
        // update the picking ray with the camera and pointer position
        raycaster.setFromCamera( pointer, camera );
    
        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);

        // console.log('intersects',intersects)
        const nodeIndex = intersects.findIndex(f => f.object && !f.object.isLine && f.object.__data.type !== 'topic')
        const labelIndex = intersects.findIndex(f => f.object && !f.object.isLine && f.object.__data.type === 'topic')
        // on hover

        let hoveredObject = null

        if (nodeIndex > -1) {
            hoveredObject = intersects[nodeIndex].object.__data
        } else if (labelIndex > -1){
            hoveredObject = intersects[labelIndex].object.__data
        } else {
            hoveredObject = null
        }

        return hoveredObject
    }

    function updateCamera(){
        const N = props.graphData?.nodes?.length
        camera.lookAt(graph.position);
        camera.position.z = Math.cbrt(N) * 180;
        camera.updateProjectionMatrix(); 
        animateFrame()
    }

    function refreshGraph() {
        setLoading(false)
        updateCamera()
        centerCamera()
    }

    function blockInteraction(e) {
        if (loading) {
            e.preventDefault()
            e.stopPropagation()
            return
        } 
    }


    const nodeObject = (node) => {
        if (node.fakeData) {
            const sprite = new SpriteText(node.label);
            sprite.color = '#000000';
            sprite.textHeight = 10 + node.scale;

            sprite.parameters = {
                precision:'lowp'
            } 
            return sprite
        }

        let color = (node.colors && node.colors[0]) ? node.colors[0] : 'tomato'
        
        if (node.type === 'topic') {
            const sprite = new SpriteText(node.name);
            sprite.color = color;
            let textSize = 15 + node.scale;
            if (textSize > 100) textSize = 100
            
            sprite.textHeight = textSize

            return sprite;
        }

        let img = node.image_url

        if (!img) {
            switch (node.type) {
                case 'youtube':
                    img = 'youtube_default.jpeg'
                    break;
                case 'twitter':
                    img = 'twitter_logo.svg'
                    break;
                case 'podcast':
                    img = 'audio_default.svg'
                    break;
                default:
                    img = 'audio_default.svg'
                }    
        } 


        const loader = new THREE.TextureLoader()

        loader.requestHeader = {
            'Access-Control-Allow-Origin': window.location.origin,    
        } 

        let material = null

        if (nodeMaterials[img]) {
            material = nodeMaterials[img]
        } else {
            const map = loader.load(img);
            material = new THREE.SpriteMaterial({
                map: map,
            });
            nodeMaterials[img] = material
        }
          
        const sprite = new THREE.Sprite(material);
    
        sprite.scale.set(20, 20, 1);

        return sprite
    }
      
    const linkObject = () => {
        const lineMaterial = new THREE.LineBasicMaterial({
            opacity: 0.6,
            transparent:true,
            color: '#000000',
        });

        const geometry = new THREE.BufferGeometry();
        
        const line = new THREE.Line(geometry, lineMaterial);
    
        return line
    }

   

    

    return <div style={{ height: '100%', width: '100%', position: 'relative' }}>

        <div
            ref={universeRef}
            onMouseMove={(e) => {
            if (loading) blockInteraction(e)
            else {
                onPointerMove(e)
                detectPointer()
            }
            
        }} onMouseDown={(e) => {
            if (loading) blockInteraction(e)
            else detectPointerClickDown()
        }}
            onMouseOut={() => {
            // return offset to 0
            cameraControls.setFocalOffset(0,0,0,true)
        }}
            onMouseUp={(e) => {
                if (loading) blockInteraction(e)
                else detectPointerClick()
            }}
            id="3d-graph"></div>
   
        <Shield style={{ opacity: loading ? 1 : 0 }}>
            <div style={{display:'flex'}}>
                <ClipLoader color={'#000'} loading={true} size={14} />
                <div style={{ marginLeft: 10 }}>Mapping {props.graphData?.nodes?.length} results...</div>
            </div>
        </Shield>
        
        {!props.graphData?.nodes?.length && <Shield>
            <div>No results</div>
        </Shield>
        }

        </div>
}

function areEqual(prevProps, nextProps) {
    /*
    return true if passing nextProps to render would return
    the same result as passing prevProps to render,
    otherwise return false
    */
    
    const { width, height, graphData, currentSearchTerm } = prevProps
    
    if (width !== nextProps.width
        || height !== nextProps.height
        || graphData !== nextProps.graphData
        || currentSearchTerm !== nextProps.currentSearchTerm) {
        return false
    }
    
    return true
  }

export default React.memo(UniverseBrowser, areEqual);

const Shield = styled.div`
display: flex;
flex-direction:column;
justify-content: center;
align-items: center;
position: absolute;
pointer-events:none;
user-select:none;
top: 0px;
left: 0px;
height: 100%;
width: 100%;
background:#f1f1f1;
color:#000;
transition: opacity 0.5s;
`