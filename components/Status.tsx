import type {Locale} from '@/lib/types';
import {label,statusTone} from '@/lib/i18n';
export function Status({value,lang}:{value:unknown;lang:Locale}){return <span className={`status status-${statusTone(value)}`}>{label(value,lang)}</span>}
