self.onmessage = (event) => {
  const { type, buffer } = event.data;

  if (type === 'generateData') {
    const sharedArray = new Int32Array(buffer);
    for (let i = 0; i < sharedArray.length; i++) {
      sharedArray[i] = Math.floor(Math.random() * 100);
    }
    self.postMessage({ type: 'dataGenerated', message: 'Data generation complete' });
  }
};
