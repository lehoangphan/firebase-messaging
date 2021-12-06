importScripts('https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.6.8/firebase-messaging.js');
 
// =========================================================
// INIT FIREBASE


const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};
 
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// [END initialize_firebase_in_sw]

class CustomPushEvent extends Event {
    constructor(data) {
        super('push')
        Object.assign(this, data)
        this.custom = true
    }
}

/*
 * Overrides push notification data, to avoid having 'notification' key and firebase blocking
 * the message handler from being called
 */
self.addEventListener('push', (e) => {
    // Skip if event is our own custom event
    if (e.custom) {
        //console.log('this is custom event', e.data.json().data)
        var payload = e.data.json().data;
        const notificationOptions = {
            body: payload.body,
            icon: payload.icon,
            actions: [{
                action: payload.click_action,
                title: 'Xem Ngay'
            }],  
            data: payload.data,
            requireInteraction: true
        };
		// Change this collapsed time for ajusting time
		const collapsedTime = 30000;
        e.waitUntil(
            self.registration.showNotification(payload.title, notificationOptions)
                .then(() => self.registration.getNotifications())
                .then(notifications => {
                    setTimeout(() => notifications.forEach(notification => notification.close()), collapsedTime);
                })
        );
        return;
    }

    // Kep old event data to override
    let oldData = e.data

    // Create a new event to dispatch, pull values from notification key and put it in data key, 
    // and then remove notification key
    let newEvent = new CustomPushEvent({
        data: {
            json() {
                let newData = oldData.json()
                newData.data = {
                    ...newData.data,
                    ...newData.notification
                }
                delete newData.notification
                return newData
            },
        },
        waitUntil: e.waitUntil.bind(e),
    })

    // Stop event propagation
    e.stopImmediatePropagation()

    // Dispatch the new wrapped event
    dispatchEvent(newEvent)
})

const messaging = firebase.messaging();

self.addEventListener('notificationclick', event => {
    console.log(event)
    event.notification.close();
    //var href = event.notification.data.click_action || event.notification.actions[0].action || event.action
    var href = event.notification.actions[0].action || event.action
    event.waitUntil(clients.matchAll({ type: "window" }).then(function (clientList) {
        for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === '/' && 'focus' in client) {
                if (href) client.href(href);
                return client.focus();
            }
        }
        if (clients.openWindow)
            return clients.openWindow(href || '/');
    }));
});
 
 
 