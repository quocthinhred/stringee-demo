import { onCleanup, Setter } from "solid-js";
import { deepCopy, isEmptyObject } from "./object";

export interface SanitizeOption {
    /**
   * List of key want to exclude
   */
    exclude?: string[],
    /**
   * if want to have only 1 key
   */
    only?: string,
    /**
   * if want to skip string field empty
   */
    isSkipEmptyString?: boolean,
    /**
   * if want to skip any field with null value
   */
    isSkipNull?: boolean,
    /**
   * if want to skip number with zero value
   */
    isSkipZero?: boolean,
}

export function sanitizeObject(obj: object, options?: SanitizeOption): object {
    let newObj = deepCopy(obj)
    options?.exclude && options?.exclude.forEach((item :string) => {
        delete newObj[item]
    })
    for (const property in newObj) {
        if (newObj[property] === undefined) {
            delete newObj[property];
        }

        if (!options) {
            continue
        }

        if (typeof(newObj[property]) === "object") {
            newObj[property] = sanitizeObject(newObj[property], options)
        }
        
        if (options.isSkipNull && typeof(newObj[property]) === "object" && isEmptyObject(newObj[property])) {
            delete newObj[property]
            continue
        }

        if (options.isSkipZero) {
            newObj[property] === 0 && delete newObj[property]
        }

        if (options.isSkipNull) {
            newObj[property] === null && delete newObj[property]
        }

        if (options.isSkipEmptyString) {
            newObj[property] === '' && delete newObj[property]
        }
    }
    if (Array.isArray(newObj)) {
        newObj = newObj.filter((item: any) => item !== undefined)
    }
    return options?.only ? newObj[options?.only] : newObj 
}

/**
 * Remove undefined key in object
 * @template T
 * @param {object} object
 * @param {SanitizeOption} option
 * @return {object}
 */
export function sanitize(object: object, option = {}): object {
    const newObj = sanitizeObject(object, option);
    return newObj;
}

export function serializeParameters(obj: any, options: SanitizeOption): string {
    const newObj = sanitizeObject(obj, options)
    for (const property in newObj) {
        if (typeof(newObj[property]) === "object") {
            const nestedObject = sanitizeObject(newObj[property], options)
            newObj[property] = JSON.stringify(nestedObject)
        }
    }
    return new URLSearchParams(newObj as string[][]).toString();
}
export interface returnValueInterface {
    /**
   * List of data want to return
   */
    data: any[]
    /**
   * List of errors
   */
    errors: any[]
}

export async function callMultiRequest<T>(payloads: T[], callback: (payload: T[], returnValue?: returnValueInterface) => Promise<void>, limit: number = 6, limitPerRequest: number = 1) {
    const returnVariable: returnValueInterface = {
        errors: [],
        data: [],
    };

    for (let i = 0; i < payloads?.length; i += limit * limitPerRequest) {
        let sliceDatas = payloads.slice(i, i + limit * limitPerRequest);
        let groupDatas = sliceDatas.reduce((result: T[][], current: T) => {
            if (result[result.length - 1]?.length < limitPerRequest) {
                result[result.length - 1] ? result[result.length - 1].push(current) : (result[result.length - 1] = [current]);
            } else {
                result[result.length] = [current];
            }
            return result;
        }, []);
        await Promise.all(
            groupDatas?.map(async (payload) => {
                try {
                    await callback(payload, returnVariable);
                } catch (err) {
                    console.log(err);
                }
            }),
        );
    }

    return returnVariable;
}

const DEFAULT_DELAY = 300
// useDebounce ...
export function useDebounce<T>(signalSetter: Setter<T>, delay: number = DEFAULT_DELAY) {
    let timerHandle: any;
    function debouncedSignalSetter(value: T extends (prev: T) => T ? T : any) {
        clearTimeout(timerHandle);
        timerHandle = setTimeout(() => signalSetter(value), delay);
    }
    onCleanup(() => clearInterval(timerHandle));
    return debouncedSignalSetter;
}

const DEFAULT_DELAY = 300

export const useDebounce = (value, delay = DEFAULT_DELAY) => {
    // State and setters for debounced value
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    },[value, delay]);

    return debouncedValue;
}