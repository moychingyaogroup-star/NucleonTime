# Real Phone/PC Notifications Setup

The project already includes the front-end code for Firebase Cloud Messaging:

- `js/notifications.js`
- `firebase-messaging-sw.js`
- updated `index.html`
- updated `firestore.rules`
- sample Cloud Functions in `cloud-functions/`

You still need to do these Firebase steps yourself.

## 1. Generate your Web Push certificate key

1. Open Firebase Console.
2. Go to Project settings.
3. Open the Cloud Messaging tab.
4. Find Web Push certificates.
5. Click Generate key pair.
6. Copy the public key.

## 2. Paste the VAPID key into `index.html`

Find this line:

```js
window.TF_FCM_VAPID_KEY = "PASTE_YOUR_WEB_PUSH_CERTIFICATE_KEY_HERE";
```

Replace the placeholder with your public Web Push certificate key.

## 3. Publish the updated Firestore rules

Use the updated `firestore.rules` from this zip. It allows users to save their own notification tokens and important dates.

## 4. Deploy the Cloud Functions

Real notifications when the website is closed need backend code. The sample code is inside `cloud-functions/`.

Install Firebase tools if you have not already:

```bash
npm install -g firebase-tools
firebase login
```

Then from your project folder:

```bash
firebase init functions
```

Choose JavaScript, then copy the files from `cloud-functions/` into the generated `functions/` folder.

Then deploy:

```bash
firebase deploy --only functions
```

## 5. Test

1. Upload the website to GitHub Pages.
2. Sign in.
3. Click the bell.
4. Click **Enable phone/PC notifications**.
5. Allow notifications in the browser popup.
6. Send a message from another account.

Expected result:

- Website open: in-app dot + browser notification.
- Website closed/backgrounded: system notification after Cloud Functions are deployed.

## Notes

- Important date reminders are checked at 8:00 every day by the sample scheduled function.
- Important dates are mirrored from local app storage to Firestore after sign-in and whenever you save dates.
- If notifications do not appear on iPhone, the site may need to be installed to the Home Screen depending on iOS/browser behavior.
