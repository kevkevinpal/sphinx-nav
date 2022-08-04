import {memo, useState, useEffect } from 'react'
import styled from "styled-components";
import ReactAudioPlayer from 'react-audio-player';
import ClipLoader from "react-spinners/ClipLoader";
import { NodesAndLinks, Node, convertFromISOtoSeconds, sleep } from './helpers';
import Modal from '../sphinxUI/modal';

interface ListContent {
    dataFilter: any,
    setDataFilter: Function,
    searchComponent: any,
    graphData: NodesAndLinks,
    visible: boolean,
    close: any,
    focusedNode: any,
    currentSearchTerm: string,
    setFocusedNode:any
}

export default function ContentBrowser(props: ListContent) {
    const { graphData, visible, focusedNode, close, searchComponent, currentSearchTerm, setFocusedNode, dataFilter, setDataFilter } = props
    const [selectedEpisodes, setSelectedEpisodes]: any = useState({})
    const [modalContent, setModalContent]: any = useState(null)
    const [yesRender, setYesRender]: any = useState(true)

    // do audio list changes on node select 
    useEffect(() => {
    
        // start async
        (async () => {
            // wait while the render appears
            await sleep(100)
            let podcastName = focusedNode?.details?.podcast_title
  
            if (focusedNode && focusedNode.details) {
                const nodeElement = document.getElementById(focusedNode.details.podcast_title)
                if (nodeElement) {
                    nodeElement.scrollIntoView({ behavior: "smooth", block: 'center', inline: 'center' })
              
                    const episodeElement = document.getElementById(focusedNode.details.podcast_title + focusedNode.details.episode_title)
                    if (episodeElement) {
                        episodeElement.scrollIntoView({ behavior: "smooth", block: 'center', inline: 'center' })
                    }
                }

                let nodeWithDetails = {
                    ...focusedNode,
                    ...focusedNode.details,
                    media_url: focusedNode.details.link
                }

                clickTimestamp(nodeWithDetails,podcastName)
            }
        })()

        doResetRender()
  
        // end async
    }, [focusedNode])

    function doResetRender(){
        setYesRender(false)
        setTimeout(() => {
            setYesRender(true)
        },20)
    }

    function startPlayback(podcastpodcastName: string, timestamp: string, audioUrl: string, skipBlock?: boolean) {
        // set audio at correct spot
        let start_time = 0
        let end_time = 0
        
        // if (!skipBlock && (selectedEpisodes[podcastpodcastName]?.media_url !== audioUrl)) {
        //   console.log('block play!')
        //   return
        // }
        
        if (timestamp) {
            let isStartAndEnd = timestamp.includes('-')
            if (isStartAndEnd) {
                let t = timestamp.split('-')
                start_time = convertFromISOtoSeconds(t[0])
                end_time = convertFromISOtoSeconds(t[1])
            } else {
                start_time = convertFromISOtoSeconds(timestamp)
            }
        }
    
        const audioElement = document.getElementById(audioUrl) as HTMLAudioElement;
        if (audioElement) {
            audioElement.currentTime = start_time || 0
    
            // set style to mark range
            // if (start_time && end_time) {
            // audioElement.style.setProperty('background', 'pink')
            // }
            
            console.log('start play!')
            // audioElement.play()
        }
    }
    
    // function stopAllOtherPlayback(el: HTMLAudioElement) {
    //   const players = Array.from(document.getElementsByClassName('audio-player'))
    //   players.forEach((p) => {
    //     let playerEl = p as HTMLAudioElement
    //     if (playerEl.id != el?.id) {
    //       if (!playerEl.paused) {
    //         console.log('pause play!')
    //         playerEl.pause()
    //       }
    //     }
    //   })
    // }

    async function clickTimestamp(t:any, podcastName:string){
        const se: any = { ...selectedEpisodes }

        se[podcastName] = { ...t, loaded: false }
        setSelectedEpisodes(se)  
        doResetRender()
        console.log('t', t)
    }
    
    
    function formatTimestamp(ts: string) {
        const splitStr = ts.split('-')

        const start = splitStr[0]
        const end = splitStr[1]
        
        let formatted = start
        if (end && parseInt(end) !== 0) {
            formatted += ` - ${end}`
        }

        return formatted
    }


    function renderPodcast() {

        const groupedPodcasts: any = {}
        graphData?.nodes?.filter((d: Node) => {
            // ignore unrelated data
            return focusedNode?.details?.podcast_title === d.details?.podcast_title
        }).forEach((d: Node, i: number) => {

            if (!d.details?.podcast_title) return

            const { podcast_title, episode_title } = d.details

            if (podcast_title && !groupedPodcasts[podcast_title]) {
                groupedPodcasts[podcast_title] = {
                    ...d.details,
                    title: podcast_title,
                    image_url: d.image_url,
                    timestamps: {
                    [episode_title]: [{
                        ...d.details,
                        title: episode_title,
                        media_url: d.details?.link
                    }]
                    }
                }
            } 
            else if (!groupedPodcasts[podcast_title].timestamps[episode_title]) {
                groupedPodcasts[podcast_title].timestamps[episode_title] = [{
                    ...d.details,
                    image_url: d.image_url,
                    title:episode_title,
                    media_url: d.details?.link
                    }]
            }
            else {
                groupedPodcasts[podcast_title].timestamps[episode_title].push({
                ...d.details,
                image_url: d.image_url,
                title: episode_title,
                media_url: d.details?.link
                })
            }
        })
        
        return (<>

            {/* 
                this will only have one object in it,
                supports many, but only one focused for now 
             */}
        {Object.keys(groupedPodcasts).map((podcastName: string, i: number) => {
          const thisPodcast = groupedPodcasts[podcastName]
          const { title, image_url, timestamps } = thisPodcast

          const selectedEpisode = selectedEpisodes[podcastName] ? selectedEpisodes[podcastName] : Object.keys(timestamps)[0]
            const audioUrl: any = selectedEpisode.media_url
            
            
            const allTopics:any = []
            
            Object.keys(thisPodcast.timestamps).forEach((keyna: string) => {
                const ts = thisPodcast.timestamps[keyna]
                ts.forEach((d:any) => {
                    d.topics.forEach((t:string) => {
                        if (!allTopics.includes(t)) allTopics.push(t)
                    })
                })
            })
            
            let tsCount = 0
                
            Object.keys(timestamps).map((episodeName: string) => {
                const thisPodcastTimestamps = timestamps[episodeName]
                tsCount += thisPodcastTimestamps.length
            })
            
          
          return <NodePanel key={i + 'ouahsf'} id={title}>
            <Col style={{
              height: 271,
                zIndex: 2,
                width: '100%',
              alignItems:'center',
              boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.2)'
            }}>
                    
                  <Row style={{ alignItems: 'center' }}>
                      <Avatar src={image_url || 'audio_default.svg'} style={{ margin: 20 }} />
                      <Col style={{paddingRight:20}}>
                          <Title>{title}</Title>
                          
                          {yesRender ? <ReactAudioPlayer
                              id={audioUrl}
                              className={'audio-player'}
                              autoPlay
                              style={{
                                  width: '100%',
                                  marginTop: "20px",
                              }}
                              src={audioUrl}
                              onError={() => {
                                const se: any = { ...selectedEpisodes }
                                se[podcastName] = { ...se[podcastName], timestamp: selectedEpisode.timestamp, media_url: audioUrl, loaded: true, error: true }
                                setSelectedEpisodes(se)
                            }}
                              onLoadedMetadata={() => {
                                  const se: any = { ...selectedEpisodes }
                                  se[podcastName] = { ...se[podcastName], timestamp: selectedEpisode.timestamp, media_url: audioUrl, loaded: true, error: false }
                                  setSelectedEpisodes(se)
                                  startPlayback(title, se[podcastName].timestamp, se[podcastName].media_url)
                              }}
                              controls
                          /> : <div style={{ height: 74 }} />}
                          </Col>
                  </Row>

                  <Divider />
                  
                  <div style={{display:'flex',flexDirection:'column',width:'100%', alignItems:'flex-start'}}>
                      <div style={{padding:'20px 20px 5px', color: '#292c33'}}>
                              {tsCount} clips in this podcast contain keyword "<Link style={{}}>{currentSearchTerm}</Link>"
                      </div>

                      <Row style={{overflowX:'auto',flexGrow:0,flexShrink:0, padding:10, width:'calc(100% - 20px)'}}>
                          {allTopics.length > 0 &&
                                  allTopics.sort((a:string, b:string)=>{
                                      if (a === currentSearchTerm) return -1
                                      return 1
                                  }).map((tag: string, i: number) => {
                                      const selected = dataFilter.includes(tag)
                                        return <Pill
                                            onClick={() => {
                                                let filter = [...dataFilter]
                                                if (!selected) {
                                                    filter = [tag]
                                                    // const indx = filter.findIndex(f=>f===tag)
                                                    // filter.splice(indx,1)
                                                } 
                                                setDataFilter(filter)
                                            }}
                                            selected={selected} key={i}>
                                            {tag}
                                            </Pill>
                                        })}
                          </Row>
                  </div>

              
              </Col>
            
            {/* scrolling list */}  
            
            <Col style={{ height:'calc(100% - 271px)'}}>
                <Scroller id={title + '_scroller'}>
                {Object.keys(timestamps).map((episodeName: any, ii: number) => {
                    const thisPodcastTimestamps = timestamps[episodeName]
                    const myKey = episodeName + '_' + i + '_' + ii
                    const defaultTimestamp = thisPodcastTimestamps[0]
                    let episodeImg = defaultTimestamp.image_url


                    // hide if no relevant topic
                    let epRelevantTopics = false
     
                    thisPodcastTimestamps.forEach((t:any) => {
                        t.topics.forEach((t: string) => {
                            if (epRelevantTopics) return
                            if (dataFilter.includes(t)) epRelevantTopics = true
                        })
                    })
                    

                    if (!epRelevantTopics) return null
                    
                    if (episodeImg && !(episodeImg.includes('_s.jpg') ||
                        episodeImg.includes('_m.jpg') ||
                        episodeImg.includes('_l.jpg'))){
                            episodeImg = episodeImg.replace('.jpg', '_s.jpg')
                    }


                    return <div key={myKey}>
                        <EpisodePanel onClick={() => {
                            clickTimestamp(defaultTimestamp, podcastName)
                        }} className={'tooltip'} id={title + episodeName}
                        style={{alignItems:'center'}}>

                            <div style={{marginRight:20}}>
                                <Avatar
                                    style={{height:40,width:40}}
                                    src={episodeImg || image_url || 'audio_default.svg'} />
                            </div>
                            
                            <div style={{overflow:'hidden', maxWidth:'calc(100% - 90px)'}}>
                            <EpisodeTitle>{episodeName}</EpisodeTitle>
                            </div>
                      
                        </EpisodePanel>
                        
                        <TimestampEnv>
                            {thisPodcastTimestamps.map((t: any, ii: number) => {

                                let relevantTopics = false

                                t.topics.forEach((t: string) => {
                                    if (relevantTopics) return
                                    if (dataFilter.includes(t)) relevantTopics = true
                                })
                                

                                if (!relevantTopics) return null
                                
                                const selected = () => {
                                    return selectedEpisodes[podcastName]?.media_url === t.media_url && selectedEpisodes[podcastName]?.timestamp === t.timestamp
                                }
                                const isError = () => {
                                    return selectedEpisodes[podcastName]?.media_url === t.media_url && selectedEpisodes[podcastName]?.timestamp === t.timestamp && selectedEpisodes[podcastName]?.error
                                }

                               
                                    


                                const isSelected = selected()

                                const color = isSelected ? '#5D8FDD' : '#3C3F41'

                                const selectedStyle = isSelected ? {
                                    fontWeight: 500,
                                    background: '#cde0ff4d',
                                    color: '#5D8FDD !important'
                                } : {
                                        fontWeight:  300,
                                        background: '#fff',
                                }

                                const errorStyle = isError() ? {
                                    color: 'red'
                                } : {}

                                return <Timestamp
                                    key={ii + 'timestamp'}
                                    style={{
                                        width: '100%',
                                        ...selectedStyle, ...errorStyle
                                    }}
                                    // key={ii + 'timestamp'}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        clickTimestamp(t, podcastName)
                                    }}>
                                    <div style={{display:'flex'}}>
                                        {isSelected&&selectedEpisodes[podcastName]?.loaded === false ?
                                            <ClipLoader color={color} loading={true} size={14} /> :
                                            <span className="material-icons" style={{
                                                color,
                                                fontSize: 18
                                            }}>{isError() ? 'error' : isSelected ? 'play_arrow' : 'access_time'}</span>
                                        }
                                    </div>

                                    <div style={{ minWidth: 10 }} />

                                    <div>
                                        <Time style={{color}}>
                                            {'' + formatTimestamp(t.timestamp)}
                                        </Time>
                                        {isSelected && <Transcript style={{ color }}>
                                            "{t.text}"
                                        </Transcript>}
                                    </div>

                                </Timestamp>

                            })
                            }
                        </TimestampEnv>
                        <Divider style={{width:'100%'}} />
                      </div>
                  })}
                  
                      {/* bottom padding */}
                      <div style={{height:100, minHeight:100}} />
                </Scroller>
              </Col>
            </NodePanel>  
        })}
        </>)
    }  
    
    function renderYoutube() {
        if (!focusedNode||!yesRender) return null

        const { description, podcast_title, episode_title, link, timestamp } = focusedNode.details
        
        const secs = convertFromISOtoSeconds(timestamp)

        let embeddedUrl: string = ''

        // to do
        // if (link.includes('watch?app=desktop&')) {
            
        // }
        
        embeddedUrl = link.replace('watch?v=', 'embed/').split('?')[0] + `?start=${secs}&autoplay=1`
        
        return <div style={{height:'100%',width:'100%'}}>
                <div style={{padding:10}}>
                    <Title style={{marginBottom:5}}>
                        {podcast_title}
                    </Title>
                    
                    <Subtitle>
                    {episode_title}
                    </Subtitle>
                </div>
                

                <iframe className="youtube-embedded"
                    height="300px" width="100%"
                    src={embeddedUrl} title="ViewVideo" frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                >
                </iframe>
                
                <Desc>
                    {description}
                </Desc>
            </div>
    }

    function renderTwitter() {
        return <div>
            Youtube
        </div>
    }


    let contentView: any = null
    
    switch (focusedNode?.type) {
        case 'youtube':
            contentView = renderYoutube()
            break;
        case 'twitter':
            contentView = renderTwitter()
            break;
        default:
            contentView = renderPodcast()
      }  
   
      if (!visible) return <div/>

  return(
      <ListWindow onClick={(e) => e.preventDefault()}> 
            <div style={{display:'flex',padding:20, position:'relative'}}>
              {searchComponent}
              
              <CloseIt onClick={()=>close()}>
                <span className="material-icons" style={{ fontSize: 20 }}>close</span>
                </CloseIt>
          </div>
          
            {contentView}
          
            <Modal
                visible={modalContent ? true : false}
                close={()=>setModalContent(null)}
            >
              {modalContent}
            </Modal>
          
            </ListWindow>
  )
}

const ListWindow = styled.div`
display:flex;
flex-direction:column;
// position:absolute;
// left:0px;
// top:0px;
height:100%;
min-height:100%;
background:#ffffff;
min-width:433px;
width:433px;
z-index:30000;
box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
overflow:hidden;

`

const Time = styled.div`
font-weight: 400;
font-size: 14px;
line-height: 18px;
/* or 129% */


/* Text 2 */

color: #3C3F41;
`

const Transcript = styled.div`
margin-top:10px;
font-weight: 400;
font-size: 13px;
line-height: 18px;
width:calc(100% - 100px);
font-style:italic;
/* Main bottom icons */

color: #5F6368;
`

const Divider = styled.div`
height:1px;
background:#ccc;
width:95%;
`
const Link = styled.span`
color:blue;
cursor:pointer;
`

const Row = styled.div`
display:flex;
width:100%;
`
const Col = styled.div`
display:flex;
flex-direction:column;
width:100%;
`

const Scroller = styled.div`
display:flex;
flex-direction:column;
width:100%;
overflow: auto;
overflow-x:hidden; 
background: #fff; 
`
const NodePanel = styled.div`
display:flex;
flex-direction:column;
align-items:center;
width:100%;
height:100%;
overflow:hidden;
&:hover{
  opacity:1;
}
`

const EpisodePanel = styled.div`
display:flex;
width:100%;
padding:10px 20px;
opacity:0.8;
cursor:pointer;

`
const CloseIt = styled.div`
position:absolute;
right:30px;
top:24px;
display:flex;
align-items:center;
justify-content:center;
cursor:pointer;
color:#000;
padding:10px;
width:fit-content;
`

interface ImgProps {
  src: string;
}
const Avatar = styled.div<ImgProps>`
background-image:url(${p => p.src});
background-size:contain;
flex-grow:0;
flex-shrink:0;
width:100px;
height:100px;
border-radius:5px;
`

const Title = styled.div`
font-size:20px;
overflow: hidden;
text-overflow: ellipsis;
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
`

const Subtitle = styled.div`
font-size:16px;
overflow: hidden;
font-style:italic;
font-weight:400;
text-overflow: ellipsis;
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
// font-family: 'Roboto';
font-style: normal;
font-weight: 400;
font-size: 14px;
line-height: 16px;
/* or 114% */


/* Primary Text 1 */

`

const Desc = styled.div`
font-size:14px;
width:calc(100% - 20px);
height:100%;
padding:10px;
background:#f1f1f1;
text-align:center;
`
interface PillProps {
    selected: boolean;
  }
const Pill = styled.div<PillProps>`
padding:10px 20px;
border-radius:20px;
flex-grow:0;
flex-shrink:0;
cursor:pointer;
margin-right:10px;
background:${p => p.selected ? '#CDE0FF' : '#F2F3F5'};
color:${p=>p.selected?'#5D8FDD':'#8E969C'};
display:flex;
justify-content:center;
align-items:center;
font-weight: 500;
font-size: 12px;
line-height: 14px;
`

const Timestamp = styled.div`
display:flex;
padding:8px;
display:flex;
font-size:14px;
width:100%;
cursor:pointer;
padding-left:76px;
&:hover{
  background:#f1f1f1;
  opacity:1;
  z-index:20;
}
`
const TimestampEnv = styled.div`
margin-bottom:20px;
`
const EpisodeTitle = styled.div`

font-weight: 400;
font-size: 14px;
line-height: 18px;
/* or 129% */

display: flex;
align-items: center;

/* Primary Text 1 */

color: #292C33;
`

