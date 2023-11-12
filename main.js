require('dotenv').config()

const INIT_ASKER = 'quark'
const INIT_ASKEE = 'bashir'
const INIT_ICEBREAKER = `What kind of music do you like?`

const OpenAI = require('openai')
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
})

const chars = {
	quark: {
		name: `Quark`,
		description: `A Ferengi and the eponymous proprietor of Quark's Bar, Grill, Gaming House and Holosuite Arcade on space station Deep Space 9.`
	},
	sisko: {
		name: `Benjamin Sisko`,
		description: `A well-known Human male Starfleet commanding officer who is perhaps best-known for his assignment aboard starbase Deep Space 9 in the Bajor sector.`
	},
	bashir: {
		name: `Julian Bashir`,
		description: `A Human Starfleet officer who serves as chief medical officer of the Federation space station Deep Space 9.`
	},
	obrien: {
		name: `Miles O'Brien`,
		description: `A Human Starfleet non-commissioned officer who serves as chief of operations aboard starbase Deep Space 9.`
	},
	garak: {
		name: `Elim Garak`,
		description: `A Cardassian tailor and Promenade shopkeeper of Garak's Clothiers who lives on Deep Space 9.`
	},
	odo: {
		name: `Odo`,
		description: `A Changeling serving as chief of security aboard the space station Deep Space 9.`
	}
},

settings = {
	bartender: `behind the bar and serving drinks at Quark's Bar on Deep Space 9.`,
	patron: `sitting at the bar at Quark's Bar on Deep Space 9.`
}

const conversation = []

let lastPrompt, asker, askee

const askBot = async opts => {
 	process.stdout.write(`\x1b[90m${('⎯'.repeat(process.stdout.columns))}\x1b[0m\n\n`)
	const chatMessages = []

	// add in character stuff
	if(opts.char){
		let messageText = `You are ${chars[opts.char].name}. You are ${chars[opts.char].description}. You are speaking in character and replying as yourself.`
		if(Math.random() < 0.25) messageText += ` Try changing the subject.`
		chatMessages.push({role: 'system', content: messageText})
		process.stdout.write(`\x1b[33m${chars[opts.char].name}:\x1b[0m `)
	}
	if(opts.setting) chatMessages.push({role: 'system', content: `You are currently ${settings[opts.setting]}`})

	// add in all previous replies
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
		model: 'gpt-4',
		stream: true
	})
	lastPrompt = ``
  for await(const chunk of chatAnswer){
  	lastPrompt += chunk.choices[0]?.delta?.content || ''
    process.stdout.write(chunk.choices[0]?.delta?.content || '')
  }
 	process.stdout.write(`\n\n`)
 	conversation.push({
 		asker: opts.asker,
 		askee: opts.askee,
 		message: lastPrompt
 	})
}

const main = async () => {

	asker = INIT_ASKER
	askee = INIT_ASKEE
	lastPrompt = INIT_ICEBREAKER

	console.log(`\n\x1b[33m${chars[asker].name}:\x1b[0m ${lastPrompt}\n`)

	for(let i = 0; i < 4; i++){
		answer = await askBot({
			asker: i % 2 == 0 ? asker : askee,
			char: i % 2 == 0 ? askee : asker,
			setting: i % 2 == 0 ? 'patron' : 'patron',
			question: lastPrompt
		})
	}

}

main()