function InMemoryStore(maxSize) {
    this.maxSize = maxSize;
    this.items = [];
    this.size = 0;
}

InMemoryStore.prototype = {
    add: function(item) {
        this.items.push(item);
        this.size++;

        if (this.size > this.maxSize) {
            console.log('[Store] removing last');
            this.size--;
            delete this.items.pop();
        }

        return this.size;
    },

    get: function(pos) {
        return this.items[pos];
    },

    last: function() {
        return this.get(this.size-1);
    }
};


module.exports = InMemoryStore;