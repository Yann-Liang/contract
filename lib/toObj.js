function toObj(str) {
    if (!str || str == '0x') return null;
    let result = null;
    try {
        result = JSON.parse(str)
    } catch (error) {
        console.warn(`toObj error`, error)
        throw new Error(error)
    }
    if (Array.isArray(result)) {
        return result.map(item => {
            try {
                item.Extra ? item.Extra = JSON.parse(item.Extra) : ''
            } catch (error) {
                console.warn('Extra error',item.Extra)
            }
            return item
        })
    } else {
        try {
            result.Extra ? result.Extra = JSON.parse(result.Extra) : ''
        } catch (error) {
            console.warn('Extra error',result.Extra)
        }
        return result
    }
    return result;
}

module.exports = toObj;