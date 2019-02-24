const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bedpres.bot@gmail.com',
        pass: 'password'
    }
});

class User{
    constructor(username, password, email){
        this.username = username;
        this.password = password;
        this.email = email;
        this.events = null;
    }
}

var users = new Map();



var launchLogin = async function(user){
    console.log("launchlogin");
    var res = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']}).then( async browser => {
        console.log("browser launched");
        var url = 'https://ifinavet.no/login'
        
        const page = await browser.newPage();
        await page.goto(url);
        var usernameEl = await page.$('input[name="username"]');
        await usernameEl.click();
        await page.keyboard.type(user.username);
        
        var passwordEl = await page.$('input[name="password"]');
        await passwordEl.click();
        await page.keyboard.type(user.password);
        var submit = await page.$('button[type="submit"]');
        submit.click();

        await page.waitForNavigation();
        
        console.log("browser logged in");
        
        return new Promise(res => {
            const success = page.url() == url ? false : true;
            res({
                success: success,
                page: page,
                browser: browser
            });
        });
    });
    console.log("lauinch done");

    return res;
}

var visitEvents = async function(page, user) {
    console.log("visitEvents");
    await page.goto('https://ifinavet.no/event');
    var eventUrls = await page.evaluate(() => {
        const regex = /https:\/\/ifinavet.no\/event\/\d\d\d/g;
        const anchors = document.querySelectorAll('a');
        return [].map.call(anchors, a => a.href).filter(x => x.match(regex));
    });

    if(user.events == null){
        user.events = new Map(eventUrls.map(url => [url, true]));
    }
    
    for(var url of eventUrls){
        if(user.events.get(url)){
            var res = await goToEvent(page, url, user);
        }
    }
    
    return new Promise(res => {
        res(true);
    })
}

var goToEvent = async function(page, url, user){
    console.log("gotoevent");

    await page.goto(url);
    const notificationText = await page.$eval('h1[class="event-title"]', el => el.textContent);
    const button = await page.$('button[type="submit"]');

    if(button != null){
        const disabled = await page.evaluate(button => button.disabled, button);
        const buttonText = await page.evaluate(button => button.textContent, button);
    
        if(!disabled && !buttonText.includes("meld deg av") && !buttonText.includes("Logg inn")){
            await button.click().then(x => {
                user.events.set(url, false);
                notifyUser(url, notificationText, user);
                
                return new Promise(res => {
                    res(true);
                });
            });
        }
    }

    return new Promise(res => {
        res(false);
    });

}

function notifyUser(url, text, user){
    console.log("notify");

    console.log(user.username, ' Påmeldt:', text);

    var mailOptions = {
        from: 'bedpres.bot@gmail.com',
        to: user.email,
        subject: 'Påmeldt bedpress',
        text: text +'\n\nFølg linken under for å finne ut mer:\n' + url
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

var start = async function(user){
    console.log("start");

    const res = launchLogin(user).then(async res => {
        if(res.success){
            await visitEvents(res.page, user);
        }

        await res.browser.close();
        return new Promise(res => {
            res(user);
        });
    })

    console.log("inside start done");    
    return res;
} 

function main(){
    const user = new User('username', 'password', 'mail@gmail.com');
    users.set(user.username, user);
    
    for(var u of users.values()){
        start(u).then(user => {
            // console.log("Done with user:\n", user);            
        });
    }
}

const add = async function(user){
    users.set(user.username, user);
    await start(user);
    console.log("start done");
    return new Promise(res => {
        res(true);
    });
}

const run = async function(){
    for(var u of users.values()){
        start(u).then(user => {});
    }
    return new Promise(res => {
        res(true);
    });
}

// main();

exports.User = User;
exports.add = add;
exports.run = run;