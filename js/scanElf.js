export const doScan = async() => {
    const ndefReader = new NDEFReader();
    await ndefReader.scan();
    ndefReader.addEventListener('reading', ({serialNumber}) => {
        if (serialNumber) {
            return serialNumber;
        }
    });
}