export const doScan = async(fun) => {
    const ndefReader = new NDEFReader();
    await ndefReader.scan();
    ndefReader.addEventListener('reading', ({serialNumber}) => {
        if (serialNumber) {
            fun(serialNumber);
        }
    });
}
