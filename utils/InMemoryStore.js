export class InMemoryStore {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.items = [];
        this.size = 0;
    }

    add(item) {
        this.items.push(item);
        this.size++;

        if (this.size > this.maxSize) {
            console.log('[Store] removing last');
            this.size--;
            delete this.items.pop();
        }

        return this.size;
    }

    get(pos) {
        return this.items[pos];
    }

    last() {
        return this.get(this.size-1);
    }
}
