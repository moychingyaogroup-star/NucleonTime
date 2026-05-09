# Firebase setup needed

Open Firebase Console → Firestore Database → Rules.

Paste the contents of `firestore.rules` and click **Publish**.

This version also fixes Accept/Reject in the website code:
- Accept/Reject first updates only the logged-in user's own documents.
- Cross-user cleanup is done separately and will not block the button anymore.

After publishing rules:
1. Refresh the website.
2. Log out and log in again.
3. Try Accept / Reject again.
