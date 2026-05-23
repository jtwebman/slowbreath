import de from '../../messages/de.json';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';
import hi from '../../messages/hi.json';
import it from '../../messages/it.json';
import ja from '../../messages/ja.json';
import ko from '../../messages/ko.json';
import nl from '../../messages/nl.json';
import pl from '../../messages/pl.json';
import pt from '../../messages/pt.json';
import ru from '../../messages/ru.json';
import zh from '../../messages/zh.json';

/**
 * Canonical message-key set, derived from `messages/en.json`.
 */
export type MessageKey = keyof typeof en;

/**
 * Compile-time guard: every non-English locale must define every key in
 * en.json. If a key is missing, TypeScript reports it during `npm run check`
 * and the CI workflow fails before merge. To add a locale, drop a new
 * messages/<code>.json and append it below.
 */
const _typecheck: Record<string, typeof en> = {
	es,
	pt,
	fr,
	de,
	it,
	nl,
	pl,
	ru,
	ja,
	ko,
	zh,
	hi
};
void _typecheck;
