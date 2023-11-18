const { app, BrowserWindow } = require('electron')
const path = require('node:path')
require('dotenv').config()

const MODEL = 'gpt-4'

const OpenAI = require('openai')
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

let contents

const createWindow = () => {
	const win = new BrowserWindow({
		width: 640,
		height: 480,
		webPreferences: {
			sandbox: false
		}
	})
	win.loadFile('index.html')
	contents = win.webContents
}

const chars = {
  quark: {
    name: `Quark`,
    description: `A  Ferengi and the eponymous proprietor of Quark's Bar, Grill, Gaming House and Holosuite Arcade on space station Deep Space 9 (previously known as Terok Nor). 
    	He was a constant thorn in the side, sometime adversary, sometime confidante of station Security Chief Odo. Even though he engaged in numerous shady ventures, by Ferengi standards, 
    	Quark was a compassionate and generous man who proved his worth and loyalty to nearly all DS9 crew members throughout the years, gaining their well-earned respect. Quark does not 
    	give drinks away.`
  },
  sisko: {
    name: `Benjamin Sisko`,
    description: `A well-known Human male Starfleet commanding officer who was perhaps best-known for his seven-year assignment aboard starbase Deep Space 9 in the Bajor sector. After 
    	discovering the Bajoran wormhole, he became known to the Bajoran people as the Emissary of the Prophets. He played a critical role as a strategist and front line commander in the 
    	Dominion War. Sisko was not quite fond of Quark, but over time, he began to tolerate the Ferengi. He blackmailed Quark on a number of occasions when he thought it necessary, such as 
    	convincing him to stay on DS9, and helping the Federation make First Contact with the Founders of the Dominion. He was grateful when Quark helped uncover the first Dominion spy, and 
    	when he saved his life from a Jem'Hadar.`,
  	icebreakers: [
  		`want to know how the war effort goes`,
  		`want to know about any cooking recipes`,
  		`want to know a story about growing up in New Orleans`
  	]
  },
  bashir: {
    name: `Julian Bashir`,
    description: `A Human Starfleet officer who served as chief medical officer of the Federation space station Deep Space 9. When Julian Bashir met Quark, they had little, if any, 
    	interaction. However, over time Quark and Bashir got on more friendly terms, which usually involved Quark offering Bashir a new holosuite program, which Bashir would occasionally 
    	deny. Other signs of friendship included the fact that Quark allowed Bashir to keep his dart board in his bar, where Bashir played darts with Chief Miles O'Brien. In addition, both 
    	become jealous of Jadzia and Worf's marriage, and even more jealous and upset after they announced that they wanted to have a baby.`,
  	icebreakers: [
  		`want to hear about any rumors on DS9`,
  		// `have a business proposition`,
  		`want to know how things are in the infirmary`,
  		`want to know if there are any exotic medical conferences coming up`
  	]
  },
  obrien: {
    name: `Miles O'Brien`,
    description: `A Human Starfleet non-commissioned officer who, following his service during the Federation-Cardassian War, served as transporter chief on board the USS Enterprise-D 
    	for several years before being promoted to chief of operations aboard starbase Deep Space 9.`,
  	icebreakers: [
  		`need the holosuites fixed`,
  		`need the replicator fixed`,
  		`want to know how Rom is doing in engineering`,
  		`want to know a story about growing up in Ireland`
  	]
  },
  garak: {
    name: `Elim Garak`,
    description: `A Cardassian tailor and Promenade shopkeeper of Garak's Clothiers who lived on Deep Space 9. He had previously been an agent of the Cardassian intelligence agency, the 
    	Obsidian Order but was exiled to Terok Nor. He worked with Starfleet during the Dominion War, returning to Cardassia Prime just prior to the Battle of Cardassia to help organize the 
    	Cardassian Liberation Front. He was known to be a witty conversationalist and a skilled tailor. Underneath his friendly and charming exterior, he was a proficient assassin, saboteur 
    	and expert liar, able to adapt to a variety of situations. He loved Cardassia and hated his exile on DS9 but was good friends with Julian Bashir and Odo.`,
  	icebreakers: [
  		`want to hear about any rumors on DS9`,
  		`want to hear about any rumors on Cardassia`,
  		// `have a business proposition`,
  		`want to know a story about growing up on Cardassia`
  	]
  },
  kira: {
  	name: `Kira Nerys`,
  	description: `A major, later colonel, in the Bajoran Militia, following years in the Bajoran Resistance during the Cardassian Occupation. She served as Bajoran liaison officer on 
  		Starfleet station Deep Space 9 and later assumed command of the station. Kira was integral in the survival of the Cardassian Rebellion against the Dominion. Kira Nerys had a cool 
  		relationship with Quark that was initially hostile based on her considering him to have "collaborated" with the Cardassians during the occupation of Bajor. This antagonism was also 
  		influenced by the sexist attitude of Ferengi toward females. She was not beyond taking advantage of his connections and unique skills, however.`,
  	icebreakers: [
  		`want to hear about any rumors on DS9`,
  		`want to know how the war effort goes`,
  		`want to know how things are going on Bajor`,
  		`want to know a story about growing up during the occupation of Bajor`
  	]
  },
  jadzia: {
  	name: `Jadzia Dax`,
  	description: `A joined Trill consisting of the Dax symbiont and the eighth host of the symbiont, Jadzia. She was a Starfleet science officer who served on space station Deep Space 
  		9 under the command of Captain Benjamin Sisko. Quark and Dax had a long-term friendship while together on the station. She understood and liked Ferengi. She spent long hours with 
  		Quark playing tongo and dabo. Quark often confided in Jadzia and asked her advice. Quark was infatuated with Jadzia, but she thought of him as a friend, and did not return his 
  		romantic feelings.`,
  	icebreakers: [
  		`want to hear about any rumors on DS9`,
  		// `have a business proposition`,
  		`want to know how Worf is doing`,
  		`want to know a story from one of Dax's previous hosts`
  	]
  }
},

settings = {
  bartender: `behind the bar and serving drinks at Quark's Bar on Deep Space 9.`,
  patron: `sitting at the bar at Quark's Bar on Deep Space 9.`
}

const INIT_ASKER = 'quark'

let conversation

let lastPrompt, asker, askee

const askBot = async opts => {
  const chatMessages = []

  if(opts.char){
    let messageText = `You are ${chars[opts.char].name}. You are ${chars[opts.char].description}. You are speaking in character and replying as yourself. 
			You are in a good mood and trying to be funny. Do not talk about Tongo or Dabo. 
    	Keep your reply short and direct. Stay on topic. Try not to repeat anything that was just said to you.`
    if(opts.first) messageText += ` You just sat down at the bar and are interested in the conversation.`
  	else messageText += ` You have been chatting with ${chars[opts.asker].name} for a bit, do not mention their name in your reply.`
    if(opts.last) messageText += ` End the conversation and announce your departure.`
		else if(conversation.length % 4 == 3){
			messageText += ` Change the subject.`
		}
		else messageText += ` Keep the conversation going and anticipate a response.`
    chatMessages.push({role: 'system', content: messageText})
		contents.executeJavaScript('app.script += `<div><span>' + chars[opts.char].name + ':&nbsp;</span>`')
  }
  if(opts.setting) chatMessages.push({role: 'system', content: `You are currently ${settings[opts.setting]}`})

  for(let i = 0; i < conversation.length; i++){
    if(conversation[i].message != lastPrompt){
      chatMessages.push({
        role: opts.asker == conversation[i].message.asker ? 'assistant' : 'user',
        content: conversation[i].message
      })
    }
  }

  if(opts.question && opts.asker) chatMessages.push({role: 'user', content: `I am ${chars[opts.asker].name}. ${opts.question}`})

  const chatAnswer = await openai.chat.completions.create({
    messages: chatMessages,
    model: MODEL,
    stream: true
  })
  lastPrompt = ``
  for await(const chunk of chatAnswer){
    lastPrompt += chunk.choices[0]?.delta?.content || ''
		contents.executeJavaScript('app.script += `<span style="color:#bebbb2">' + (chunk.choices[0]?.delta?.content || '') +'</span>`')
	  await new Promise(e => setTimeout(e, 150))
  }
	contents.executeJavaScript('app.script += `</div>`')
  conversation.push({
    asker: opts.asker,
    askee: opts.askee,
    message: lastPrompt
  })
  await new Promise(e => setTimeout(e, 500))
}

let lastAskee

const getAskee = () => {
  let askee = Object.keys(chars)[Object.keys(chars).length * Math.random() << 0]
  if(askee == 'quark' || askee == lastAskee) return getAskee()
	else{
		lastAskee = askee
		return askee
	}
}

const init = async () => {
  asker = INIT_ASKER
  askee = getAskee()
  conversation = []
  const conLength = Math.floor(Math.random() * 3) * 2 + 3
  for(let i = 0; i < conLength; i++){
    if(i == 0) {
			contents.executeJavaScript('app.imageLeftOpacity = 1')
			contents.executeJavaScript('app.imageRightOpacity = 0.5')
			contents.executeJavaScript('app.imageRight = `' + askee + '`')
    	contents.executeJavaScript('app.script += `<div><span style="color:#7bb24e">' + chars[askee].name + ' Enters.</span></div>`')
    	await new Promise(e => setTimeout(e, 1000))

			contents.executeJavaScript('app.script += `<div><span>' + chars[asker].name + ': </span>`')

		  const icebreakerAnswer = await openai.chat.completions.create({
		  	messages: [
			  	{
			  		role: 'system',
			  		content: `You are ${chars[asker].name}. You are ${chars[asker].description}. You are speaking in character and replying as yourself. 
			  			You are in a good mood and trying to be funny. Do not talk about Tongo or Dabo. 
			  			${chars[askee].name} has come to your bar and you ${chars[askee].icebreakers[Math.floor(Math.random() * chars[askee].icebreakers.length)]}. 
			  			Do not introduce yourself. What is the first thing you say? Do not use quotations in your response. Stay on topic. Be direct.`
			  	}
		  	],
		    model: MODEL,
		    stream: true
		  })
		  lastPrompt = ``
		  for await(const chunk of icebreakerAnswer){
		    lastPrompt += chunk.choices[0]?.delta?.content || ''
				contents.executeJavaScript('app.script += `<span style="color:#bebbb2">' + (chunk.choices[0]?.delta?.content || '') +'</span>`')
			  await new Promise(e => setTimeout(e, 150))
		  }
			contents.executeJavaScript('app.script += `</div>`')

		}
		if(i % 2 == 0){
			contents.executeJavaScript('app.imageLeftOpacity = 0.5')
			contents.executeJavaScript('app.imageRightOpacity = 1')
		} else {
			contents.executeJavaScript('app.imageLeftOpacity = 1')
			contents.executeJavaScript('app.imageRightOpacity = 0.5')
		}
    answer = await askBot({
      asker: i % 2 == 0 ? asker : askee,
      char: i % 2 == 0 ? askee : asker,
      setting: i % 2 == 0 ? 'patron' : 'bartender',
      question: lastPrompt,
      last: i == conLength - 1,
      first: i == 0
    })
    if(i == conLength - 1){
    	contents.executeJavaScript('app.script += `<div><span style="color:#e89973">' + chars[askee].name + ' Leaves.</span></div>`')
			contents.executeJavaScript('app.imageRight = false')
    	setTimeout(() => {
    		init()
    	}, 2000)
    }
  }
}

app.whenReady().then(() => {
	createWindow()
	init()
})