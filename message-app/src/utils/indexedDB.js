const DB_NAME = "MessageAppDB";
const DB_VERSION = 2; // Incrementa la versión si cambias la estructura

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Crear almacén de mensajes
      if (!db.objectStoreNames.contains("messages")) {
        const messageStore = db.createObjectStore("messages", { keyPath: "id" });
        messageStore.createIndex("chat", ["sender_id", "receiver_id"], { unique: false });
        messageStore.createIndex("created_at", "created_at", { unique: false });
      }

      // Crear almacén de contactos
      if (!db.objectStoreNames.contains("contacts")) {
        db.createObjectStore("contacts", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveMessages = async (messages) => {
  const db = await initDB();
  const transaction = db.transaction("messages", "readwrite");
  const store = transaction.objectStore("messages");

  messages.forEach((message) => {
    store.put(message);
  });

  return transaction.complete;
};

export const getMessages = async (sender_id, receiver_id, limit = 20, offset = 0) => {
  const db = await initDB();
  const transaction = db.transaction("messages", "readonly");
  const store = transaction.objectStore("messages");

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      console.log("[getMessages] Todos los mensajes en IndexedDB:", request.result);

      const results = request.result.filter(
        (msg) =>
          (msg.sender_id === sender_id && msg.receiver_id === receiver_id) ||
          (msg.sender_id === receiver_id && msg.receiver_id === sender_id)
      );
      resolve(results.slice(offset, offset + limit));
    };

    request.onerror = () => reject(request.error);
  });
};

export const saveContacts = async (contacts) => {
  const db = await initDB();
  const transaction = db.transaction("contacts", "readwrite");
  const store = transaction.objectStore("contacts");

  contacts.forEach((contact) => store.put(contact));

  return transaction.complete;
};

export const getContacts = async () => {
  const db = await initDB();
  const transaction = db.transaction("contacts", "readonly");
  const store = transaction.objectStore("contacts");

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      console.log("Contacts fetched from IndexedDB:", request.result); // Verifica los datos aquí
      resolve(request.result);
    };

    request.onerror = () => {
      console.error("Error fetching contacts from IndexedDB:", request.error);
      reject(request.error);
    };
  });
};

export const deleteMessage = async (messageId) => {
  const db = await initDB();
  const transaction = db.transaction("messages", "readwrite");
  const store = transaction.objectStore("messages");

  return new Promise((resolve, reject) => {
    const request = store.delete(messageId);

    request.onsuccess = () => {
      console.log(`Message with ID ${messageId} deleted from IndexedDB`);
      resolve();
    };

    request.onerror = () => {
      console.error("Error deleting message from IndexedDB:", request.error);
      reject(request.error);
    };
  });
};