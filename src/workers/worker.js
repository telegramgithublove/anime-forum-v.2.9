// worker.js
self.onmessage = function(e) {
    console.log('Worker received:', e.data);
    // Здесь можно добавить любую тяжелую обработку
    self.postMessage('Worker processed: ' + e.data);
};
