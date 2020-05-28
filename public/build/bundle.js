
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function toVal(mix) {
    	var k, y, str='';
    	if (mix) {
    		if (typeof mix === 'object') {
    			if (Array.isArray(mix)) {
    				for (k=0; k < mix.length; k++) {
    					if (mix[k] && (y = toVal(mix[k]))) {
    						str && (str += ' ');
    						str += y;
    					}
    				}
    			} else {
    				for (k in mix) {
    					if (mix[k] && (y = toVal(k))) {
    						str && (str += ' ');
    						str += y;
    					}
    				}
    			}
    		} else if (typeof mix !== 'boolean' && !mix.call) {
    			str && (str += ' ');
    			str += mix;
    		}
    	}
    	return str;
    }

    function clsx () {
    	var i=0, x, str='';
    	while (i < arguments.length) {
    		if (x = toVal(arguments[i++])) {
    			str && (str += ' ');
    			str += x;
    		}
    	}
    	return str;
    }

    function clean($$props) {
      const rest = {};
      for (const key of Object.keys($$props)) {
        if (key !== "children" && key !== "$$scope" && key !== "$$slots") {
          rest[key] = $$props[key];
        }
      }
      return rest;
    }

    /* node_modules\sveltestrap\src\Table.svelte generated by Svelte v3.22.3 */
    const file = "node_modules\\sveltestrap\\src\\Table.svelte";

    // (38:0) {:else}
    function create_else_block(ctx) {
    	let table;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);
    	let table_levels = [/*props*/ ctx[3], { class: /*classes*/ ctx[1] }];
    	let table_data = {};

    	for (let i = 0; i < table_levels.length; i += 1) {
    		table_data = assign(table_data, table_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			if (default_slot) default_slot.c();
    			set_attributes(table, table_data);
    			add_location(table, file, 38, 2, 908);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4096) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
    				}
    			}

    			set_attributes(table, get_spread_update(table_levels, [
    				dirty & /*props*/ 8 && /*props*/ ctx[3],
    				dirty & /*classes*/ 2 && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(38:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:0) {#if responsive}
    function create_if_block(ctx) {
    	let div;
    	let table;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);
    	let table_levels = [/*props*/ ctx[3], { class: /*classes*/ ctx[1] }];
    	let table_data = {};

    	for (let i = 0; i < table_levels.length; i += 1) {
    		table_data = assign(table_data, table_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			table = element("table");
    			if (default_slot) default_slot.c();
    			set_attributes(table, table_data);
    			add_location(table, file, 33, 4, 826);
    			attr_dev(div, "class", /*responsiveClassName*/ ctx[2]);
    			add_location(div, file, 32, 2, 788);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, table);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4096) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
    				}
    			}

    			set_attributes(table, get_spread_update(table_levels, [
    				dirty & /*props*/ 8 && /*props*/ ctx[3],
    				dirty & /*classes*/ 2 && { class: /*classes*/ ctx[1] }
    			]));

    			if (!current || dirty & /*responsiveClassName*/ 4) {
    				attr_dev(div, "class", /*responsiveClassName*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(32:0) {#if responsive}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*responsive*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { class: className = "" } = $$props;
    	let { size = "" } = $$props;
    	let { bordered = false } = $$props;
    	let { borderless = false } = $$props;
    	let { striped = false } = $$props;
    	let { dark = false } = $$props;
    	let { hover = false } = $$props;
    	let { responsive = false } = $$props;
    	const props = clean($$props);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Table", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("class" in $$new_props) $$invalidate(4, className = $$new_props.class);
    		if ("size" in $$new_props) $$invalidate(5, size = $$new_props.size);
    		if ("bordered" in $$new_props) $$invalidate(6, bordered = $$new_props.bordered);
    		if ("borderless" in $$new_props) $$invalidate(7, borderless = $$new_props.borderless);
    		if ("striped" in $$new_props) $$invalidate(8, striped = $$new_props.striped);
    		if ("dark" in $$new_props) $$invalidate(9, dark = $$new_props.dark);
    		if ("hover" in $$new_props) $$invalidate(10, hover = $$new_props.hover);
    		if ("responsive" in $$new_props) $$invalidate(0, responsive = $$new_props.responsive);
    		if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		clsx,
    		clean,
    		className,
    		size,
    		bordered,
    		borderless,
    		striped,
    		dark,
    		hover,
    		responsive,
    		props,
    		classes,
    		responsiveClassName
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(4, className = $$new_props.className);
    		if ("size" in $$props) $$invalidate(5, size = $$new_props.size);
    		if ("bordered" in $$props) $$invalidate(6, bordered = $$new_props.bordered);
    		if ("borderless" in $$props) $$invalidate(7, borderless = $$new_props.borderless);
    		if ("striped" in $$props) $$invalidate(8, striped = $$new_props.striped);
    		if ("dark" in $$props) $$invalidate(9, dark = $$new_props.dark);
    		if ("hover" in $$props) $$invalidate(10, hover = $$new_props.hover);
    		if ("responsive" in $$props) $$invalidate(0, responsive = $$new_props.responsive);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    		if ("responsiveClassName" in $$props) $$invalidate(2, responsiveClassName = $$new_props.responsiveClassName);
    	};

    	let classes;
    	let responsiveClassName;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, size, bordered, borderless, striped, dark, hover*/ 2032) {
    			 $$invalidate(1, classes = clsx(className, "table", size ? "table-" + size : false, bordered ? "table-bordered" : false, borderless ? "table-borderless" : false, striped ? "table-striped" : false, dark ? "table-dark" : false, hover ? "table-hover" : false));
    		}

    		if ($$self.$$.dirty & /*responsive*/ 1) {
    			 $$invalidate(2, responsiveClassName = responsive === true
    			? "table-responsive"
    			: `table-responsive-${responsive}`);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		responsive,
    		classes,
    		responsiveClassName,
    		props,
    		className,
    		size,
    		bordered,
    		borderless,
    		striped,
    		dark,
    		hover,
    		$$props,
    		$$scope,
    		$$slots
    	];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			class: 4,
    			size: 5,
    			bordered: 6,
    			borderless: 7,
    			striped: 8,
    			dark: 9,
    			hover: 10,
    			responsive: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get class() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bordered() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bordered(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderless() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderless(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get striped() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set striped(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dark() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dark(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hover() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hover(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get responsive() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set responsive(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\sveltestrap\src\Button.svelte generated by Svelte v3.22.3 */
    const file$1 = "node_modules\\sveltestrap\\src\\Button.svelte";

    // (53:0) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	let button_levels = [
    		/*props*/ ctx[10],
    		{ id: /*id*/ ctx[4] },
    		{ class: /*classes*/ ctx[8] },
    		{ disabled: /*disabled*/ ctx[2] },
    		{ value: /*value*/ ctx[6] },
    		{
    			"aria-label": /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[9]
    		},
    		{ style: /*style*/ ctx[5] }
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			button = element("button");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			set_attributes(button, button_data);
    			add_location(button, file$1, 53, 2, 1061);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(button, null);
    			}

    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[21], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 262144) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[18], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null));
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty & /*close, children, $$scope*/ 262147) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				dirty & /*props*/ 1024 && /*props*/ ctx[10],
    				dirty & /*id*/ 16 && { id: /*id*/ ctx[4] },
    				dirty & /*classes*/ 256 && { class: /*classes*/ ctx[8] },
    				dirty & /*disabled*/ 4 && { disabled: /*disabled*/ ctx[2] },
    				dirty & /*value*/ 64 && { value: /*value*/ ctx[6] },
    				dirty & /*ariaLabel, defaultAriaLabel*/ 640 && {
    					"aria-label": /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[9]
    				},
    				dirty & /*style*/ 32 && { style: /*style*/ ctx[5] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(53:0) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (37:0) {#if href}
    function create_if_block$1(ctx) {
    	let a;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*children*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	let a_levels = [
    		/*props*/ ctx[10],
    		{ id: /*id*/ ctx[4] },
    		{ class: /*classes*/ ctx[8] },
    		{ disabled: /*disabled*/ ctx[2] },
    		{ href: /*href*/ ctx[3] },
    		{
    			"aria-label": /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[9]
    		},
    		{ style: /*style*/ ctx[5] }
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			a = element("a");
    			if_block.c();
    			set_attributes(a, a_data);
    			add_location(a, file$1, 37, 2, 825);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);
    			if_blocks[current_block_type_index].m(a, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", /*click_handler*/ ctx[20], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(a, null);
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*props*/ 1024 && /*props*/ ctx[10],
    				dirty & /*id*/ 16 && { id: /*id*/ ctx[4] },
    				dirty & /*classes*/ 256 && { class: /*classes*/ ctx[8] },
    				dirty & /*disabled*/ 4 && { disabled: /*disabled*/ ctx[2] },
    				dirty & /*href*/ 8 && { href: /*href*/ ctx[3] },
    				dirty & /*ariaLabel, defaultAriaLabel*/ 640 && {
    					"aria-label": /*ariaLabel*/ ctx[7] || /*defaultAriaLabel*/ ctx[9]
    				},
    				dirty & /*style*/ 32 && { style: /*style*/ ctx[5] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if_blocks[current_block_type_index].d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(37:0) {#if href}",
    		ctx
    	});

    	return block_1;
    }

    // (68:6) {:else}
    function create_else_block_2(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);

    	const block_1 = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 262144) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[18], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(68:6) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (66:25) 
    function create_if_block_3(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*children*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children*/ 1) set_data_dev(t, /*children*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(66:25) ",
    		ctx
    	});

    	return block_1;
    }

    // (64:6) {#if close}
    function create_if_block_2(ctx) {
    	let span;

    	const block_1 = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "×";
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$1, 64, 8, 1250);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(64:6) {#if close}",
    		ctx
    	});

    	return block_1;
    }

    // (63:10)        
    function fallback_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_if_block_3, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*close*/ ctx[1]) return 0;
    		if (/*children*/ ctx[0]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block_1 = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(63:10)        ",
    		ctx
    	});

    	return block_1;
    }

    // (49:4) {:else}
    function create_else_block$1(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);

    	const block_1 = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 262144) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[18], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(49:4) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (47:4) {#if children}
    function create_if_block_1(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*children*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children*/ 1) set_data_dev(t, /*children*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(47:4) {#if children}",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block_1 = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { class: className = "" } = $$props;
    	let { active = false } = $$props;
    	let { block = false } = $$props;
    	let { children = undefined } = $$props;
    	let { close = false } = $$props;
    	let { color = "secondary" } = $$props;
    	let { disabled = false } = $$props;
    	let { href = "" } = $$props;
    	let { id = "" } = $$props;
    	let { outline = false } = $$props;
    	let { size = "" } = $$props;
    	let { style = "" } = $$props;
    	let { value = "" } = $$props;
    	const props = clean($$props);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, ['default']);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("class" in $$new_props) $$invalidate(11, className = $$new_props.class);
    		if ("active" in $$new_props) $$invalidate(12, active = $$new_props.active);
    		if ("block" in $$new_props) $$invalidate(13, block = $$new_props.block);
    		if ("children" in $$new_props) $$invalidate(0, children = $$new_props.children);
    		if ("close" in $$new_props) $$invalidate(1, close = $$new_props.close);
    		if ("color" in $$new_props) $$invalidate(14, color = $$new_props.color);
    		if ("disabled" in $$new_props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("href" in $$new_props) $$invalidate(3, href = $$new_props.href);
    		if ("id" in $$new_props) $$invalidate(4, id = $$new_props.id);
    		if ("outline" in $$new_props) $$invalidate(15, outline = $$new_props.outline);
    		if ("size" in $$new_props) $$invalidate(16, size = $$new_props.size);
    		if ("style" in $$new_props) $$invalidate(5, style = $$new_props.style);
    		if ("value" in $$new_props) $$invalidate(6, value = $$new_props.value);
    		if ("$$scope" in $$new_props) $$invalidate(18, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		clsx,
    		clean,
    		className,
    		active,
    		block,
    		children,
    		close,
    		color,
    		disabled,
    		href,
    		id,
    		outline,
    		size,
    		style,
    		value,
    		props,
    		ariaLabel,
    		classes,
    		defaultAriaLabel
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(17, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(11, className = $$new_props.className);
    		if ("active" in $$props) $$invalidate(12, active = $$new_props.active);
    		if ("block" in $$props) $$invalidate(13, block = $$new_props.block);
    		if ("children" in $$props) $$invalidate(0, children = $$new_props.children);
    		if ("close" in $$props) $$invalidate(1, close = $$new_props.close);
    		if ("color" in $$props) $$invalidate(14, color = $$new_props.color);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("href" in $$props) $$invalidate(3, href = $$new_props.href);
    		if ("id" in $$props) $$invalidate(4, id = $$new_props.id);
    		if ("outline" in $$props) $$invalidate(15, outline = $$new_props.outline);
    		if ("size" in $$props) $$invalidate(16, size = $$new_props.size);
    		if ("style" in $$props) $$invalidate(5, style = $$new_props.style);
    		if ("value" in $$props) $$invalidate(6, value = $$new_props.value);
    		if ("ariaLabel" in $$props) $$invalidate(7, ariaLabel = $$new_props.ariaLabel);
    		if ("classes" in $$props) $$invalidate(8, classes = $$new_props.classes);
    		if ("defaultAriaLabel" in $$props) $$invalidate(9, defaultAriaLabel = $$new_props.defaultAriaLabel);
    	};

    	let ariaLabel;
    	let classes;
    	let defaultAriaLabel;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(7, ariaLabel = $$props["aria-label"]);

    		if ($$self.$$.dirty & /*className, close, outline, color, size, block, active*/ 129026) {
    			 $$invalidate(8, classes = clsx(className, { close }, close || "btn", close || `btn${outline ? "-outline" : ""}-${color}`, size ? `btn-${size}` : false, block ? "btn-block" : false, { active }));
    		}

    		if ($$self.$$.dirty & /*close*/ 2) {
    			 $$invalidate(9, defaultAriaLabel = close ? "Close" : null);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		children,
    		close,
    		disabled,
    		href,
    		id,
    		style,
    		value,
    		ariaLabel,
    		classes,
    		defaultAriaLabel,
    		props,
    		className,
    		active,
    		block,
    		color,
    		outline,
    		size,
    		$$props,
    		$$scope,
    		$$slots,
    		click_handler,
    		click_handler_1
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			class: 11,
    			active: 12,
    			block: 13,
    			children: 0,
    			close: 1,
    			color: 14,
    			disabled: 2,
    			href: 3,
    			id: 4,
    			outline: 15,
    			size: 16,
    			style: 5,
    			value: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get class() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get children() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set children(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set close(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outline() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outline(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\rpc\RpcsTable.svelte generated by Svelte v3.22.3 */

    const { console: console_1 } = globals;
    const file$2 = "src\\front\\rpc\\RpcsTable.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	return child_ctx;
    }

    // (269:19) <Button outline color="danger" on:click={loadInitialData}>
    function create_default_slot_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("CARGAR DATOS INCIALES");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(269:19) <Button outline color=\\\"danger\\\" on:click={loadInitialData}>",
    		ctx
    	});

    	return block;
    }

    // (270:1) {#if userMsg}
    function create_if_block$2(ctx) {
    	let h3;
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			p = element("p");
    			t = text(/*userMsg*/ ctx[2]);
    			set_style(p, "color", "orange");
    			add_location(p, file$2, 270, 5, 6545);
    			add_location(h3, file$2, 270, 1, 6541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*userMsg*/ 4) set_data_dev(t, /*userMsg*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(270:1) {#if userMsg}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import {onMount}
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>   import {onMount}",
    		ctx
    	});

    	return block;
    }

    // (274:1) {:then rpcs}
    function create_then_block(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				style: "width:auto;",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};

    			if (dirty[0] & /*rpcs, newRpc*/ 9 | dirty[1] & /*$$scope*/ 256) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(274:1) {:then rpcs}",
    		ctx
    	});

    	return block;
    }

    // (301:8) <Button on:click={insertRPC} outline color="primary">
    function create_default_slot_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("INSERTAR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(301:8) <Button on:click={insertRPC} outline color=\\\"primary\\\">",
    		ctx
    	});

    	return block;
    }

    // (314:8) <Button on:click={deleteRPC(rpc.country,rpc.year)} outline color="danger">
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("BORRAR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(314:8) <Button on:click={deleteRPC(rpc.country,rpc.year)} outline color=\\\"danger\\\">",
    		ctx
    	});

    	return block;
    }

    // (303:3) {#each rpcs as rpc}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let a;
    	let t0_value = /*rpc*/ ctx[36].country + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let td1;
    	let t2_value = /*rpc*/ ctx[36].year + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*rpc*/ ctx[36].rpc + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*rpc*/ ctx[36].piba + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*rpc*/ ctx[36].pib1t + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = /*rpc*/ ctx[36].pib2t + "";
    	let t10;
    	let t11;
    	let td6;
    	let t12_value = /*rpc*/ ctx[36].pib3t + "";
    	let t12;
    	let t13;
    	let td7;
    	let t14_value = /*rpc*/ ctx[36].pib4t + "";
    	let t14;
    	let t15;
    	let td8;
    	let t16_value = /*rpc*/ ctx[36].vpy + "";
    	let t16;
    	let t17;
    	let td9;
    	let t18;
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*deleteRPC*/ ctx[6](/*rpc*/ ctx[36].country, /*rpc*/ ctx[36].year))) /*deleteRPC*/ ctx[6](/*rpc*/ ctx[36].country, /*rpc*/ ctx[36].year).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td6 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td7 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			td8 = element("td");
    			t16 = text(t16_value);
    			t17 = space();
    			td9 = element("td");
    			create_component(button.$$.fragment);
    			t18 = space();
    			attr_dev(a, "href", a_href_value = "/#/rpcs/" + /*rpc*/ ctx[36].country + "/" + /*rpc*/ ctx[36].year);
    			add_location(a, file$2, 304, 8, 7716);
    			add_location(td0, file$2, 304, 4, 7712);
    			add_location(td1, file$2, 305, 4, 7787);
    			add_location(td2, file$2, 306, 4, 7812);
    			add_location(td3, file$2, 307, 4, 7836);
    			add_location(td4, file$2, 308, 4, 7861);
    			add_location(td5, file$2, 309, 4, 7887);
    			add_location(td6, file$2, 310, 4, 7913);
    			add_location(td7, file$2, 311, 4, 7939);
    			add_location(td8, file$2, 312, 4, 7965);
    			add_location(td9, file$2, 313, 4, 7989);
    			add_location(tr, file$2, 303, 3, 7702);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, a);
    			append_dev(a, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td6);
    			append_dev(td6, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td7);
    			append_dev(td7, t14);
    			append_dev(tr, t15);
    			append_dev(tr, td8);
    			append_dev(td8, t16);
    			append_dev(tr, t17);
    			append_dev(tr, td9);
    			mount_component(button, td9, null);
    			append_dev(tr, t18);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*rpcs*/ 8) && t0_value !== (t0_value = /*rpc*/ ctx[36].country + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*rpcs*/ 8 && a_href_value !== (a_href_value = "/#/rpcs/" + /*rpc*/ ctx[36].country + "/" + /*rpc*/ ctx[36].year)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if ((!current || dirty[0] & /*rpcs*/ 8) && t2_value !== (t2_value = /*rpc*/ ctx[36].year + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*rpcs*/ 8) && t4_value !== (t4_value = /*rpc*/ ctx[36].rpc + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[0] & /*rpcs*/ 8) && t6_value !== (t6_value = /*rpc*/ ctx[36].piba + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty[0] & /*rpcs*/ 8) && t8_value !== (t8_value = /*rpc*/ ctx[36].pib1t + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty[0] & /*rpcs*/ 8) && t10_value !== (t10_value = /*rpc*/ ctx[36].pib2t + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty[0] & /*rpcs*/ 8) && t12_value !== (t12_value = /*rpc*/ ctx[36].pib3t + "")) set_data_dev(t12, t12_value);
    			if ((!current || dirty[0] & /*rpcs*/ 8) && t14_value !== (t14_value = /*rpc*/ ctx[36].pib4t + "")) set_data_dev(t14, t14_value);
    			if ((!current || dirty[0] & /*rpcs*/ 8) && t16_value !== (t16_value = /*rpc*/ ctx[36].vpy + "")) set_data_dev(t16, t16_value);
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(303:3) {#each rpcs as rpc}",
    		ctx
    	});

    	return block;
    }

    // (318:2) <Button outline color="danger" on:click={deleteRPCS}>
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("BORRAR TODO");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(318:2) <Button outline color=\\\"danger\\\" on:click={deleteRPCS}>",
    		ctx
    	});

    	return block;
    }

    // (275:1) <Table bordered style="width:auto;">
    function create_default_slot_4(ctx) {
    	let thead;
    	let tr0;
    	let td0;
    	let t1;
    	let td1;
    	let t3;
    	let td2;
    	let t5;
    	let td3;
    	let t7;
    	let td4;
    	let t9;
    	let td5;
    	let t11;
    	let td6;
    	let t13;
    	let td7;
    	let t15;
    	let td8;
    	let t17;
    	let td9;
    	let t19;
    	let tbody;
    	let tr1;
    	let td10;
    	let input0;
    	let t20;
    	let td11;
    	let input1;
    	let t21;
    	let td12;
    	let input2;
    	let t22;
    	let td13;
    	let input3;
    	let t23;
    	let td14;
    	let input4;
    	let t24;
    	let td15;
    	let input5;
    	let t25;
    	let td16;
    	let input6;
    	let t26;
    	let td17;
    	let input7;
    	let t27;
    	let td18;
    	let input8;
    	let t28;
    	let td19;
    	let t29;
    	let t30;
    	let current;
    	let dispose;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*insertRPC*/ ctx[5]);
    	let each_value = /*rpcs*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*deleteRPCS*/ ctx[7]);

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Country";
    			t1 = space();
    			td1 = element("td");
    			td1.textContent = "Year";
    			t3 = space();
    			td2 = element("td");
    			td2.textContent = "RPC";
    			t5 = space();
    			td3 = element("td");
    			td3.textContent = "PIB A";
    			t7 = space();
    			td4 = element("td");
    			td4.textContent = "PIB 1T";
    			t9 = space();
    			td5 = element("td");
    			td5.textContent = "PIB 2T";
    			t11 = space();
    			td6 = element("td");
    			td6.textContent = "PIB 3T";
    			t13 = space();
    			td7 = element("td");
    			td7.textContent = "PIB 4T";
    			t15 = space();
    			td8 = element("td");
    			td8.textContent = "VPY";
    			t17 = space();
    			td9 = element("td");
    			td9.textContent = "ACTIONS";
    			t19 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td10 = element("td");
    			input0 = element("input");
    			t20 = space();
    			td11 = element("td");
    			input1 = element("input");
    			t21 = space();
    			td12 = element("td");
    			input2 = element("input");
    			t22 = space();
    			td13 = element("td");
    			input3 = element("input");
    			t23 = space();
    			td14 = element("td");
    			input4 = element("input");
    			t24 = space();
    			td15 = element("td");
    			input5 = element("input");
    			t25 = space();
    			td16 = element("td");
    			input6 = element("input");
    			t26 = space();
    			td17 = element("td");
    			input7 = element("input");
    			t27 = space();
    			td18 = element("td");
    			input8 = element("input");
    			t28 = space();
    			td19 = element("td");
    			create_component(button0.$$.fragment);
    			t29 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t30 = space();
    			create_component(button1.$$.fragment);
    			add_location(td0, file$2, 277, 4, 6693);
    			add_location(td1, file$2, 278, 4, 6715);
    			add_location(td2, file$2, 279, 4, 6734);
    			add_location(td3, file$2, 280, 4, 6752);
    			add_location(td4, file$2, 281, 4, 6772);
    			add_location(td5, file$2, 282, 4, 6793);
    			add_location(td6, file$2, 283, 4, 6814);
    			add_location(td7, file$2, 284, 4, 6835);
    			add_location(td8, file$2, 285, 4, 6856);
    			add_location(td9, file$2, 286, 4, 6874);
    			add_location(tr0, file$2, 276, 3, 6683);
    			add_location(thead, file$2, 275, 2, 6671);
    			set_style(input0, "width", "100px");
    			add_location(input0, file$2, 291, 8, 6942);
    			add_location(td10, file$2, 291, 4, 6938);
    			set_style(input1, "width", "50px");
    			add_location(input1, file$2, 292, 8, 7018);
    			add_location(td11, file$2, 292, 4, 7014);
    			set_style(input2, "width", "100px");
    			add_location(input2, file$2, 293, 8, 7090);
    			add_location(td12, file$2, 293, 4, 7086);
    			set_style(input3, "width", "100px");
    			add_location(input3, file$2, 294, 8, 7160);
    			add_location(td13, file$2, 294, 4, 7156);
    			set_style(input4, "width", "100px");
    			add_location(input4, file$2, 295, 8, 7231);
    			add_location(td14, file$2, 295, 4, 7227);
    			set_style(input5, "width", "100px");
    			add_location(input5, file$2, 296, 8, 7303);
    			add_location(td15, file$2, 296, 4, 7299);
    			set_style(input6, "width", "100px");
    			add_location(input6, file$2, 297, 8, 7375);
    			add_location(td16, file$2, 297, 4, 7371);
    			set_style(input7, "width", "100px");
    			add_location(input7, file$2, 298, 8, 7447);
    			add_location(td17, file$2, 298, 4, 7443);
    			set_style(input8, "width", "50px");
    			add_location(input8, file$2, 299, 8, 7519);
    			add_location(td18, file$2, 299, 4, 7515);
    			add_location(td19, file$2, 300, 4, 7584);
    			add_location(tr1, file$2, 290, 3, 6928);
    			add_location(tbody, file$2, 289, 2, 6916);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, td0);
    			append_dev(tr0, t1);
    			append_dev(tr0, td1);
    			append_dev(tr0, t3);
    			append_dev(tr0, td2);
    			append_dev(tr0, t5);
    			append_dev(tr0, td3);
    			append_dev(tr0, t7);
    			append_dev(tr0, td4);
    			append_dev(tr0, t9);
    			append_dev(tr0, td5);
    			append_dev(tr0, t11);
    			append_dev(tr0, td6);
    			append_dev(tr0, t13);
    			append_dev(tr0, td7);
    			append_dev(tr0, t15);
    			append_dev(tr0, td8);
    			append_dev(tr0, t17);
    			append_dev(tr0, td9);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td10);
    			append_dev(td10, input0);
    			set_input_value(input0, /*newRpc*/ ctx[0].country);
    			append_dev(tr1, t20);
    			append_dev(tr1, td11);
    			append_dev(td11, input1);
    			set_input_value(input1, /*newRpc*/ ctx[0].year);
    			append_dev(tr1, t21);
    			append_dev(tr1, td12);
    			append_dev(td12, input2);
    			set_input_value(input2, /*newRpc*/ ctx[0].rpc);
    			append_dev(tr1, t22);
    			append_dev(tr1, td13);
    			append_dev(td13, input3);
    			set_input_value(input3, /*newRpc*/ ctx[0].piba);
    			append_dev(tr1, t23);
    			append_dev(tr1, td14);
    			append_dev(td14, input4);
    			set_input_value(input4, /*newRpc*/ ctx[0].pib1t);
    			append_dev(tr1, t24);
    			append_dev(tr1, td15);
    			append_dev(td15, input5);
    			set_input_value(input5, /*newRpc*/ ctx[0].pib2t);
    			append_dev(tr1, t25);
    			append_dev(tr1, td16);
    			append_dev(td16, input6);
    			set_input_value(input6, /*newRpc*/ ctx[0].pib3t);
    			append_dev(tr1, t26);
    			append_dev(tr1, td17);
    			append_dev(td17, input7);
    			set_input_value(input7, /*newRpc*/ ctx[0].pib4t);
    			append_dev(tr1, t27);
    			append_dev(tr1, td18);
    			append_dev(td18, input8);
    			set_input_value(input8, /*newRpc*/ ctx[0].vpy);
    			append_dev(tr1, t28);
    			append_dev(tr1, td19);
    			mount_component(button0, td19, null);
    			append_dev(tbody, t29);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			insert_dev(target, t30, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[18]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[19]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[20]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[21]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[22]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[23]),
    				listen_dev(input6, "input", /*input6_input_handler*/ ctx[24]),
    				listen_dev(input7, "input", /*input7_input_handler*/ ctx[25]),
    				listen_dev(input8, "input", /*input8_input_handler*/ ctx[26])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newRpc*/ 1 && input0.value !== /*newRpc*/ ctx[0].country) {
    				set_input_value(input0, /*newRpc*/ ctx[0].country);
    			}

    			if (dirty[0] & /*newRpc*/ 1 && input1.value !== /*newRpc*/ ctx[0].year) {
    				set_input_value(input1, /*newRpc*/ ctx[0].year);
    			}

    			if (dirty[0] & /*newRpc*/ 1 && input2.value !== /*newRpc*/ ctx[0].rpc) {
    				set_input_value(input2, /*newRpc*/ ctx[0].rpc);
    			}

    			if (dirty[0] & /*newRpc*/ 1 && input3.value !== /*newRpc*/ ctx[0].piba) {
    				set_input_value(input3, /*newRpc*/ ctx[0].piba);
    			}

    			if (dirty[0] & /*newRpc*/ 1 && input4.value !== /*newRpc*/ ctx[0].pib1t) {
    				set_input_value(input4, /*newRpc*/ ctx[0].pib1t);
    			}

    			if (dirty[0] & /*newRpc*/ 1 && input5.value !== /*newRpc*/ ctx[0].pib2t) {
    				set_input_value(input5, /*newRpc*/ ctx[0].pib2t);
    			}

    			if (dirty[0] & /*newRpc*/ 1 && input6.value !== /*newRpc*/ ctx[0].pib3t) {
    				set_input_value(input6, /*newRpc*/ ctx[0].pib3t);
    			}

    			if (dirty[0] & /*newRpc*/ 1 && input7.value !== /*newRpc*/ ctx[0].pib4t) {
    				set_input_value(input7, /*newRpc*/ ctx[0].pib4t);
    			}

    			if (dirty[0] & /*newRpc*/ 1 && input8.value !== /*newRpc*/ ctx[0].vpy) {
    				set_input_value(input8, /*newRpc*/ ctx[0].vpy);
    			}

    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);

    			if (dirty[0] & /*deleteRPC, rpcs*/ 72) {
    				each_value = /*rpcs*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(tbody);
    			destroy_component(button0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t30);
    			destroy_component(button1, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(275:1) <Table bordered style=\\\"width:auto;\\\">",
    		ctx
    	});

    	return block;
    }

    // (273:14) ;   {:then rpcs}
    function create_pending_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(";");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(273:14) ;   {:then rpcs}",
    		ctx
    	});

    	return block;
    }

    // (349:2) <Button outline color="secondary" on:click={searchRPCS} on:click={setOffsetZero}>
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("BUSCAR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(349:2) <Button outline color=\\\"secondary\\\" on:click={searchRPCS} on:click={setOffsetZero}>",
    		ctx
    	});

    	return block;
    }

    // (322:1) <Table bordered style="width: auto;">
    function create_default_slot_2(ctx) {
    	let thead;
    	let tr0;
    	let td0;
    	let t1;
    	let td1;
    	let t3;
    	let td2;
    	let t5;
    	let td3;
    	let t7;
    	let td4;
    	let t9;
    	let td5;
    	let t11;
    	let td6;
    	let t13;
    	let td7;
    	let t15;
    	let td8;
    	let t17;
    	let tbody;
    	let tr1;
    	let td9;
    	let input0;
    	let t18;
    	let td10;
    	let input1;
    	let t19;
    	let td11;
    	let input2;
    	let t20;
    	let td12;
    	let input3;
    	let t21;
    	let td13;
    	let input4;
    	let t22;
    	let td14;
    	let input5;
    	let t23;
    	let td15;
    	let input6;
    	let t24;
    	let td16;
    	let input7;
    	let t25;
    	let td17;
    	let input8;
    	let t26;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*searchRPCS*/ ctx[8]);
    	button.$on("click", /*setOffsetZero*/ ctx[11]);

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Country";
    			t1 = space();
    			td1 = element("td");
    			td1.textContent = "Year";
    			t3 = space();
    			td2 = element("td");
    			td2.textContent = "RPC";
    			t5 = space();
    			td3 = element("td");
    			td3.textContent = "PIB A";
    			t7 = space();
    			td4 = element("td");
    			td4.textContent = "PIB 1T";
    			t9 = space();
    			td5 = element("td");
    			td5.textContent = "PIB 2T";
    			t11 = space();
    			td6 = element("td");
    			td6.textContent = "PIB 3T";
    			t13 = space();
    			td7 = element("td");
    			td7.textContent = "PIB 4T";
    			t15 = space();
    			td8 = element("td");
    			td8.textContent = "VPY";
    			t17 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td9 = element("td");
    			input0 = element("input");
    			t18 = space();
    			td10 = element("td");
    			input1 = element("input");
    			t19 = space();
    			td11 = element("td");
    			input2 = element("input");
    			t20 = space();
    			td12 = element("td");
    			input3 = element("input");
    			t21 = space();
    			td13 = element("td");
    			input4 = element("input");
    			t22 = space();
    			td14 = element("td");
    			input5 = element("input");
    			t23 = space();
    			td15 = element("td");
    			input6 = element("input");
    			t24 = space();
    			td16 = element("td");
    			input7 = element("input");
    			t25 = space();
    			td17 = element("td");
    			input8 = element("input");
    			t26 = space();
    			create_component(button.$$.fragment);
    			add_location(td0, file$2, 324, 4, 8288);
    			add_location(td1, file$2, 325, 4, 8310);
    			add_location(td2, file$2, 326, 4, 8329);
    			add_location(td3, file$2, 327, 4, 8347);
    			add_location(td4, file$2, 328, 4, 8367);
    			add_location(td5, file$2, 329, 4, 8388);
    			add_location(td6, file$2, 330, 4, 8409);
    			add_location(td7, file$2, 331, 4, 8430);
    			add_location(td8, file$2, 332, 4, 8451);
    			add_location(tr0, file$2, 323, 3, 8278);
    			add_location(thead, file$2, 322, 2, 8266);
    			set_style(input0, "width", "100px");
    			add_location(input0, file$2, 337, 8, 8515);
    			add_location(td9, file$2, 337, 4, 8511);
    			set_style(input1, "width", "50px");
    			add_location(input1, file$2, 338, 8, 8593);
    			add_location(td10, file$2, 338, 4, 8589);
    			set_style(input2, "width", "100px");
    			add_location(input2, file$2, 339, 8, 8667);
    			add_location(td11, file$2, 339, 4, 8663);
    			set_style(input3, "width", "100px");
    			add_location(input3, file$2, 340, 8, 8739);
    			add_location(td12, file$2, 340, 4, 8735);
    			set_style(input4, "width", "100px");
    			add_location(input4, file$2, 341, 8, 8812);
    			add_location(td13, file$2, 341, 4, 8808);
    			set_style(input5, "width", "100px");
    			add_location(input5, file$2, 342, 8, 8886);
    			add_location(td14, file$2, 342, 4, 8882);
    			set_style(input6, "width", "100px");
    			add_location(input6, file$2, 343, 8, 8960);
    			add_location(td15, file$2, 343, 4, 8956);
    			set_style(input7, "width", "100px");
    			add_location(input7, file$2, 344, 8, 9034);
    			add_location(td16, file$2, 344, 4, 9030);
    			set_style(input8, "width", "50px");
    			add_location(input8, file$2, 345, 8, 9108);
    			add_location(td17, file$2, 345, 4, 9104);
    			add_location(tr1, file$2, 336, 3, 8501);
    			add_location(tbody, file$2, 335, 2, 8489);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, td0);
    			append_dev(tr0, t1);
    			append_dev(tr0, td1);
    			append_dev(tr0, t3);
    			append_dev(tr0, td2);
    			append_dev(tr0, t5);
    			append_dev(tr0, td3);
    			append_dev(tr0, t7);
    			append_dev(tr0, td4);
    			append_dev(tr0, t9);
    			append_dev(tr0, td5);
    			append_dev(tr0, t11);
    			append_dev(tr0, td6);
    			append_dev(tr0, t13);
    			append_dev(tr0, td7);
    			append_dev(tr0, t15);
    			append_dev(tr0, td8);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td9);
    			append_dev(td9, input0);
    			set_input_value(input0, /*queryRpc*/ ctx[1].country);
    			append_dev(tr1, t18);
    			append_dev(tr1, td10);
    			append_dev(td10, input1);
    			set_input_value(input1, /*queryRpc*/ ctx[1].year);
    			append_dev(tr1, t19);
    			append_dev(tr1, td11);
    			append_dev(td11, input2);
    			set_input_value(input2, /*queryRpc*/ ctx[1].rpc);
    			append_dev(tr1, t20);
    			append_dev(tr1, td12);
    			append_dev(td12, input3);
    			set_input_value(input3, /*queryRpc*/ ctx[1].piba);
    			append_dev(tr1, t21);
    			append_dev(tr1, td13);
    			append_dev(td13, input4);
    			set_input_value(input4, /*queryRpc*/ ctx[1].pib1t);
    			append_dev(tr1, t22);
    			append_dev(tr1, td14);
    			append_dev(td14, input5);
    			set_input_value(input5, /*queryRpc*/ ctx[1].pib2t);
    			append_dev(tr1, t23);
    			append_dev(tr1, td15);
    			append_dev(td15, input6);
    			set_input_value(input6, /*queryRpc*/ ctx[1].pib3t);
    			append_dev(tr1, t24);
    			append_dev(tr1, td16);
    			append_dev(td16, input7);
    			set_input_value(input7, /*queryRpc*/ ctx[1].pib4t);
    			append_dev(tr1, t25);
    			append_dev(tr1, td17);
    			append_dev(td17, input8);
    			set_input_value(input8, /*queryRpc*/ ctx[1].vpy);
    			insert_dev(target, t26, anchor);
    			mount_component(button, target, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[27]),
    				listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[28]),
    				listen_dev(input2, "input", /*input2_input_handler_1*/ ctx[29]),
    				listen_dev(input3, "input", /*input3_input_handler_1*/ ctx[30]),
    				listen_dev(input4, "input", /*input4_input_handler_1*/ ctx[31]),
    				listen_dev(input5, "input", /*input5_input_handler_1*/ ctx[32]),
    				listen_dev(input6, "input", /*input6_input_handler_1*/ ctx[33]),
    				listen_dev(input7, "input", /*input7_input_handler_1*/ ctx[34]),
    				listen_dev(input8, "input", /*input8_input_handler_1*/ ctx[35])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*queryRpc*/ 2 && input0.value !== /*queryRpc*/ ctx[1].country) {
    				set_input_value(input0, /*queryRpc*/ ctx[1].country);
    			}

    			if (dirty[0] & /*queryRpc*/ 2 && input1.value !== /*queryRpc*/ ctx[1].year) {
    				set_input_value(input1, /*queryRpc*/ ctx[1].year);
    			}

    			if (dirty[0] & /*queryRpc*/ 2 && input2.value !== /*queryRpc*/ ctx[1].rpc) {
    				set_input_value(input2, /*queryRpc*/ ctx[1].rpc);
    			}

    			if (dirty[0] & /*queryRpc*/ 2 && input3.value !== /*queryRpc*/ ctx[1].piba) {
    				set_input_value(input3, /*queryRpc*/ ctx[1].piba);
    			}

    			if (dirty[0] & /*queryRpc*/ 2 && input4.value !== /*queryRpc*/ ctx[1].pib1t) {
    				set_input_value(input4, /*queryRpc*/ ctx[1].pib1t);
    			}

    			if (dirty[0] & /*queryRpc*/ 2 && input5.value !== /*queryRpc*/ ctx[1].pib2t) {
    				set_input_value(input5, /*queryRpc*/ ctx[1].pib2t);
    			}

    			if (dirty[0] & /*queryRpc*/ 2 && input6.value !== /*queryRpc*/ ctx[1].pib3t) {
    				set_input_value(input6, /*queryRpc*/ ctx[1].pib3t);
    			}

    			if (dirty[0] & /*queryRpc*/ 2 && input7.value !== /*queryRpc*/ ctx[1].pib4t) {
    				set_input_value(input7, /*queryRpc*/ ctx[1].pib4t);
    			}

    			if (dirty[0] & /*queryRpc*/ 2 && input8.value !== /*queryRpc*/ ctx[1].vpy) {
    				set_input_value(input8, /*queryRpc*/ ctx[1].vpy);
    			}

    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(tbody);
    			if (detaching) detach_dev(t26);
    			destroy_component(button, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(322:1) <Table bordered style=\\\"width: auto;\\\">",
    		ctx
    	});

    	return block;
    }

    // (351:1) <Button outline color="secondary" on:click={beforeOffset}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("ANTERIOR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(351:1) <Button outline color=\\\"secondary\\\" on:click={beforeOffset}>",
    		ctx
    	});

    	return block;
    }

    // (352:1) <Button outline color="secondary" on:click={nextOffset}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SIGUIENTE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(352:1) <Button outline color=\\\"secondary\\\" on:click={nextOffset}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let a;
    	let t1;
    	let h2;
    	let t3;
    	let t4;
    	let t5;
    	let promise;
    	let t6;
    	let t7;
    	let t8;
    	let current;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*loadInitialData*/ ctx[4]);
    	let if_block = /*userMsg*/ ctx[2] && create_if_block$2(ctx);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 3,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*rpcs*/ ctx[3], info);

    	const table = new Table({
    			props: {
    				bordered: true,
    				style: "width: auto;",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*beforeOffset*/ ctx[9]);

    	const button2 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", /*nextOffset*/ ctx[10]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			a = element("a");
    			a.textContent = "SOS1920-11";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "RPCS GUI";
    			t3 = space();
    			create_component(button0.$$.fragment);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			info.block.c();
    			t6 = space();
    			create_component(table.$$.fragment);
    			t7 = space();
    			create_component(button1.$$.fragment);
    			t8 = space();
    			create_component(button2.$$.fragment);
    			attr_dev(a, "href", "/#/");
    			add_location(a, file$2, 267, 5, 6380);
    			add_location(h1, file$2, 267, 1, 6376);
    			add_location(h2, file$2, 268, 1, 6416);
    			add_location(main, file$2, 266, 0, 6367);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, a);
    			append_dev(main, t1);
    			append_dev(main, h2);
    			append_dev(main, t3);
    			mount_component(button0, main, null);
    			append_dev(main, t4);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t5);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t6;
    			append_dev(main, t6);
    			mount_component(table, main, null);
    			append_dev(main, t7);
    			mount_component(button1, main, null);
    			append_dev(main, t8);
    			mount_component(button2, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);

    			if (/*userMsg*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(main, t5);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			info.ctx = ctx;

    			if (dirty[0] & /*rpcs*/ 8 && promise !== (promise = /*rpcs*/ ctx[3]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[3] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			const table_changes = {};

    			if (dirty[0] & /*queryRpc*/ 2 | dirty[1] & /*$$scope*/ 256) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(info.block);
    			transition_in(table.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(table.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(button0);
    			if (if_block) if_block.d();
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(table);
    			destroy_component(button1);
    			destroy_component(button2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let rpcs = [];

    	let newRpc = {
    		country: "",
    		year: 0,
    		rpc: 0,
    		piba: 0,
    		pib1t: 0,
    		pib2t: 0,
    		pib3t: 0,
    		pib4t: 0,
    		vpy: 0
    	};

    	let queryRpc = {
    		country: "",
    		year: "",
    		rpc: "",
    		piba: "",
    		pib1t: "",
    		pib2t: "",
    		pib3t: "",
    		pib4t: "",
    		vpy: ""
    	};

    	let offset = 0;
    	let limit = 10;
    	let numTotal;
    	let numFiltered;
    	let userMsg;
    	onMount(getRPCS);

    	async function loadInitialData() {
    		console.log("Loading initial rpcs..");
    		const res = await fetch("/api/v2/rents-per-capita/loadInitialData");
    		$$invalidate(2, userMsg = "DATOS INICIALES CARGADOS.");

    		if (res.ok) {
    			console.log("DATOS INICIALES CARGADOS!");
    			getRPCS();
    		} else {
    			$$invalidate(3, rpcs = []);

    			if (userMsg != "Todos los datos han sido borrados.") {
    				$$invalidate(2, userMsg = "No se han encontrado datos.");
    			}

    			console.log("Datasabe empty");
    		}
    	}

    	async function getRPCS() {
    		var query = "";
    		numTotal = await getNumTotal(query);
    		console.log("Fetching rpcs..");
    		query = query + "?limit=" + limit + "&offset=" + offset;
    		const res = await fetch("/api/v2/rents-per-capita" + query);

    		if (res.ok) {
    			console.log("OK!");
    			const json = await res.json();
    			$$invalidate(3, rpcs = json);
    			console.log("Received " + rpcs.length + " rpcs.");

    			if (userMsg == "El dato fue insertado correctamente." || userMsg == "El dato ha sido borrado." || userMsg == "DATOS INICIALES CARGADOS.") {
    				$$invalidate(2, userMsg = userMsg + "\nMostrando " + rpcs.length + " de " + numTotal + " datos. Página:" + (offset / limit + 1));
    			} else {
    				$$invalidate(2, userMsg = "Mostrando " + rpcs.length + " de " + numTotal + " datos. Página:" + (offset / limit + 1));
    			}
    		} else {
    			$$invalidate(3, rpcs = []);

    			if (userMsg != "Todos los datos han sido borrados.") {
    				$$invalidate(2, userMsg = "No se han encontrado datos.");
    			}

    			console.log("Datasabe empty");
    		}
    	}

    	async function insertRPC() {
    		if (newRpc.country != "" && !isNaN(parseInt(newRpc.year))) {
    			rpcs.forEach(x => {
    				if (x.country == newRpc.country && x.year == newRpc.year) {
    					$$invalidate(2, userMsg = "El dato de ese año y país ya existe.");
    				}
    			});

    			$$invalidate(0, newRpc.year = parseInt(newRpc.year), newRpc);
    			$$invalidate(0, newRpc.rpc = parseInt(newRpc.rpc), newRpc);
    			$$invalidate(0, newRpc.piba = parseInt(newRpc.piba), newRpc);
    			$$invalidate(0, newRpc.pib1t = parseInt(newRpc.pib1t), newRpc);
    			$$invalidate(0, newRpc.pib2t = parseInt(newRpc.pib2t), newRpc);
    			$$invalidate(0, newRpc.pib3t = parseInt(newRpc.pib3t), newRpc);
    			$$invalidate(0, newRpc.pib4t = parseInt(newRpc.pib4t), newRpc);
    			$$invalidate(0, newRpc.vpy = parseFloat(newRpc.vpy), newRpc);

    			if (userMsg != "El dato de ese año y país ya existe.") {
    				console.log("Inserting rpc... " + JSON.stringify(newRpc));

    				const res = await fetch("/api/v2/rents-per-capita", {
    					method: "POST",
    					body: JSON.stringify(newRpc),
    					headers: { "Content-Type": "application/json" }
    				}).then(function (res) {
    					$$invalidate(2, userMsg = "El dato fue insertado correctamente.");
    					getRPCS();
    				});
    			}
    		} else {
    			$$invalidate(2, userMsg = "El dato insertado no tiene nombre/año válido/s .");
    			console.log("Inserted rpc has no valid name or valid year.");
    		}
    	}

    	async function deleteRPC(country, year) {
    		console.log("Deleting rpc... ");

    		const res = await fetch("/api/v2/rents-per-capita/" + country + "/" + year, { method: "DELETE" }).then(function (res) {
    			getRPCS();
    			$$invalidate(2, userMsg = "El dato ha sido borrado.");
    		});
    	}

    	async function deleteRPCS() {
    		console.log("Deleting rpcs..");

    		const res = await fetch("/api/v2/rents-per-capita", { method: "DELETE" }).then(function (res) {
    			$$invalidate(2, userMsg = "Todos los datos han sido borrados.");
    			getRPCS();
    		});
    	}

    	async function searchRPCS() {
    		console.log("Searching..");
    		var query = "?";

    		if (queryRpc.country != "") {
    			if (query == "?") {
    				query = query + "country=" + queryRpc.country;
    			} else {
    				query = query + "&country=" + queryRpc.country;
    			}
    		}

    		if (queryRpc.year != "") {
    			if (query == "?") {
    				query = query + "year=" + queryRpc.year;
    			} else {
    				query = query + "&year=" + queryRpc.year;
    			}
    		}

    		if (queryRpc.rpc != "") {
    			if (query == "?") {
    				query = query + "rpc=" + queryRpc.rpc;
    			} else {
    				query = query + "&rpc=" + queryRpc.rpc;
    			}
    		}

    		if (queryRpc.piba != "") {
    			if (query == "?") {
    				query = query + "piba=" + queryRpc.piba;
    			} else {
    				query = query + "&piba=" + queryRpc.piba;
    			}
    		}

    		if (queryRpc.pib1t != "") {
    			if (query == "?") {
    				query = query + "pib1y=" + queryRpc.pib1t;
    			} else {
    				query = query + "&pib1t=" + queryRpc.pib1t;
    			}
    		}

    		if (queryRpc.pib2t != "") {
    			if (query == "?") {
    				query = query + "pib2t=" + queryRpc.pib2t;
    			} else {
    				query = query + "&pib2t=" + queryRpc.pib2t;
    			}
    		}

    		if (queryRpc.pib3t != "") {
    			if (query == "?") {
    				query = query + "pib3t=" + queryRpc.pib3t;
    			} else {
    				query = query + "&pib3t=" + queryRpc.pib3t;
    			}
    		}

    		if (queryRpc.pib4t != "") {
    			if (query == "?") {
    				query = query + "pib4t=" + queryRpc.pib4t;
    			} else {
    				query = query + "&pib4t=" + queryRpc.pib4t;
    			}
    		}

    		if (queryRpc.vpy != "") {
    			if (query == "?") {
    				query = query + "vpy=" + queryRpc.vpy;
    			} else {
    				query = query + "&vpy=" + queryRpc.vpy;
    			}
    		}

    		numTotal = await getNumTotal(query);
    		query = query + "&limit=" + limit + "&offset=" + offset;
    		const res = await fetch("/api/v2/rents-per-capita" + query);
    		console.log("Sending ");

    		if (numTotal > 0) {
    			console.log("OK!");
    			const json = await res.json();
    			$$invalidate(3, rpcs = json);
    			console.log("Received " + rpcs.length + " rpcs, offset = " + offset + ".");
    			$$invalidate(2, userMsg = "Mostrando " + rpcs.length + " de " + numTotal + " datos. Página:" + (offset / limit + 1));
    		} else {
    			$$invalidate(3, rpcs = []);
    			$$invalidate(2, userMsg = "No se han encontrado datos.");
    			console.log("Not found");
    		}
    	}

    	async function getNumTotal(query) {
    		const res = await fetch("/api/v2/rents-per-capita" + query);

    		if (res.ok) {
    			const json = await res.json();
    			$$invalidate(3, rpcs = json);
    			return parseInt(rpcs.length);
    		} else {
    			if (userMsg != "Todos los datos han sido borrados.") {
    				$$invalidate(2, userMsg = "No se han encontrado datos.");
    			}

    			return 0;
    		}
    	}

    	async function beforeOffset() {
    		if (offset >= limit) offset = offset - limit;
    		searchRPCS();
    	}

    	async function nextOffset() {
    		if (offset + limit < numTotal) offset = offset + limit;
    		searchRPCS();
    	}

    	async function setOffsetZero() {
    		offset = 0;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<RpcsTable> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RpcsTable", $$slots, []);

    	function input0_input_handler() {
    		newRpc.country = this.value;
    		$$invalidate(0, newRpc);
    	}

    	function input1_input_handler() {
    		newRpc.year = this.value;
    		$$invalidate(0, newRpc);
    	}

    	function input2_input_handler() {
    		newRpc.rpc = this.value;
    		$$invalidate(0, newRpc);
    	}

    	function input3_input_handler() {
    		newRpc.piba = this.value;
    		$$invalidate(0, newRpc);
    	}

    	function input4_input_handler() {
    		newRpc.pib1t = this.value;
    		$$invalidate(0, newRpc);
    	}

    	function input5_input_handler() {
    		newRpc.pib2t = this.value;
    		$$invalidate(0, newRpc);
    	}

    	function input6_input_handler() {
    		newRpc.pib3t = this.value;
    		$$invalidate(0, newRpc);
    	}

    	function input7_input_handler() {
    		newRpc.pib4t = this.value;
    		$$invalidate(0, newRpc);
    	}

    	function input8_input_handler() {
    		newRpc.vpy = this.value;
    		$$invalidate(0, newRpc);
    	}

    	function input0_input_handler_1() {
    		queryRpc.country = this.value;
    		$$invalidate(1, queryRpc);
    	}

    	function input1_input_handler_1() {
    		queryRpc.year = this.value;
    		$$invalidate(1, queryRpc);
    	}

    	function input2_input_handler_1() {
    		queryRpc.rpc = this.value;
    		$$invalidate(1, queryRpc);
    	}

    	function input3_input_handler_1() {
    		queryRpc.piba = this.value;
    		$$invalidate(1, queryRpc);
    	}

    	function input4_input_handler_1() {
    		queryRpc.pib1t = this.value;
    		$$invalidate(1, queryRpc);
    	}

    	function input5_input_handler_1() {
    		queryRpc.pib2t = this.value;
    		$$invalidate(1, queryRpc);
    	}

    	function input6_input_handler_1() {
    		queryRpc.pib3t = this.value;
    		$$invalidate(1, queryRpc);
    	}

    	function input7_input_handler_1() {
    		queryRpc.pib4t = this.value;
    		$$invalidate(1, queryRpc);
    	}

    	function input8_input_handler_1() {
    		queryRpc.vpy = this.value;
    		$$invalidate(1, queryRpc);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Table,
    		Button,
    		rpcs,
    		newRpc,
    		queryRpc,
    		offset,
    		limit,
    		numTotal,
    		numFiltered,
    		userMsg,
    		loadInitialData,
    		getRPCS,
    		insertRPC,
    		deleteRPC,
    		deleteRPCS,
    		searchRPCS,
    		getNumTotal,
    		beforeOffset,
    		nextOffset,
    		setOffsetZero
    	});

    	$$self.$inject_state = $$props => {
    		if ("rpcs" in $$props) $$invalidate(3, rpcs = $$props.rpcs);
    		if ("newRpc" in $$props) $$invalidate(0, newRpc = $$props.newRpc);
    		if ("queryRpc" in $$props) $$invalidate(1, queryRpc = $$props.queryRpc);
    		if ("offset" in $$props) offset = $$props.offset;
    		if ("limit" in $$props) limit = $$props.limit;
    		if ("numTotal" in $$props) numTotal = $$props.numTotal;
    		if ("numFiltered" in $$props) numFiltered = $$props.numFiltered;
    		if ("userMsg" in $$props) $$invalidate(2, userMsg = $$props.userMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		newRpc,
    		queryRpc,
    		userMsg,
    		rpcs,
    		loadInitialData,
    		insertRPC,
    		deleteRPC,
    		deleteRPCS,
    		searchRPCS,
    		beforeOffset,
    		nextOffset,
    		setOffsetZero,
    		offset,
    		numTotal,
    		limit,
    		numFiltered,
    		getRPCS,
    		getNumTotal,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		input2_input_handler_1,
    		input3_input_handler_1,
    		input4_input_handler_1,
    		input5_input_handler_1,
    		input6_input_handler_1,
    		input7_input_handler_1,
    		input8_input_handler_1
    	];
    }

    class RpcsTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RpcsTable",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.22.3 */

    const { Error: Error_1, Object: Object_1, console: console_1$1 } = globals;

    // (209:0) {:else}
    function create_else_block$2(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (207:0) {#if componentParams}
    function create_if_block$3(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(207:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(route, userData, ...conditions) {
    	// Check if we don't have userData
    	if (userData && typeof userData == "function") {
    		conditions = conditions && conditions.length ? conditions : [];
    		conditions.unshift(userData);
    		userData = undefined;
    	}

    	// Parameter route and each item of conditions must be functions
    	if (!route || typeof route != "function") {
    		throw Error("Invalid parameter route");
    	}

    	if (conditions && conditions.length) {
    		for (let i = 0; i < conditions.length; i++) {
    			if (!conditions[i] || typeof conditions[i] != "function") {
    				throw Error("Invalid parameter conditions[" + i + "]");
    			}
    		}
    	}

    	// Returns an object that contains all the functions to execute too
    	const obj = { route, userData };

    	if (conditions && conditions.length) {
    		obj.conditions = conditions;
    	}

    	// The _sveltesparouter flag is to confirm the object was created by this router
    	Object.defineProperty(obj, "_sveltesparouter", { value: true });

    	return obj;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    	});
    }

    function pop() {
    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.history.back();
    	});
    }

    function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    		try {
    			window.history.replaceState(undefined, undefined, dest);
    		} catch(e) {
    			// eslint-disable-next-line no-console
    			console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    		}

    		// The method above doesn't trigger the hashchange event, so let's do that manually
    		window.dispatchEvent(new Event("hashchange"));
    	});
    }

    function link(node) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	// Destination must start with '/'
    	const href = node.getAttribute("href");

    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to every href attribute
    	node.setAttribute("href", "#" + href);
    }

    function nextTickPromise(cb) {
    	return new Promise(resolve => {
    			setTimeout(
    				() => {
    					resolve(cb());
    				},
    				0
    			);
    		});
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		nextTickPromise,
    		createEventDispatcher,
    		regexparam,
    		routes,
    		prefix,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		dispatch,
    		dispatchNextTick,
    		$loc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
    				$$invalidate(0, component = null);

    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);

    						// Set componentParams onloy if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    						// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    						if (match && typeof match == "object" && Object.keys(match).length) {
    							$$invalidate(1, componentParams = match);
    						} else {
    							$$invalidate(1, componentParams = null);
    						}

    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [
    		component,
    		componentParams,
    		routes,
    		prefix,
    		$loc,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\rpc\EditRpc.svelte generated by Svelte v3.22.3 */

    const { console: console_1$2 } = globals;
    const file$3 = "src\\front\\rpc\\EditRpc.svelte";

    // (71:56) {#if userMsg}
    function create_if_block$4(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*userMsg*/ ctx[8]);
    			set_style(p, "color", "orange");
    			add_location(p, file$3, 70, 69, 2080);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*userMsg*/ 256) set_data_dev(t, /*userMsg*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(71:56) {#if userMsg}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import {onMount}
    function create_catch_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script>      import {onMount}",
    		ctx
    	});

    	return block;
    }

    // (74:1) {:then rpc}
    function create_then_block$1(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};

    			if (dirty & /*$$scope, updatedVpy, updatedPib4t, updatedPib3t, updatedPib2t, updatedPib1t, updatedPiba, updatedRPC, rpc*/ 2097918) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(74:1) {:then rpc}",
    		ctx
    	});

    	return block;
    }

    // (101:8) <Button on:click={updateRPC} outline color="primary">
    function create_default_slot_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("ACTUALIZAR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(101:8) <Button on:click={updateRPC} outline color=\\\"primary\\\">",
    		ctx
    	});

    	return block;
    }

    // (75:1) <Table bordered>
    function create_default_slot_1$1(ctx) {
    	let thead;
    	let tr0;
    	let td0;
    	let t1;
    	let td1;
    	let t3;
    	let td2;
    	let t5;
    	let td3;
    	let t7;
    	let td4;
    	let t9;
    	let td5;
    	let t11;
    	let td6;
    	let t13;
    	let td7;
    	let t15;
    	let td8;
    	let t17;
    	let td9;
    	let t19;
    	let tbody;
    	let tr1;
    	let td10;
    	let t20_value = /*rpc*/ ctx[9].country + "";
    	let t20;
    	let t21;
    	let td11;
    	let t22_value = /*rpc*/ ctx[9].year + "";
    	let t22;
    	let t23;
    	let td12;
    	let input0;
    	let t24;
    	let td13;
    	let input1;
    	let t25;
    	let td14;
    	let input2;
    	let t26;
    	let td15;
    	let input3;
    	let t27;
    	let td16;
    	let input4;
    	let t28;
    	let td17;
    	let input5;
    	let t29;
    	let td18;
    	let input6;
    	let t30;
    	let td19;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*updateRPC*/ ctx[10]);

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Country";
    			t1 = space();
    			td1 = element("td");
    			td1.textContent = "Year";
    			t3 = space();
    			td2 = element("td");
    			td2.textContent = "RPC";
    			t5 = space();
    			td3 = element("td");
    			td3.textContent = "PIB A";
    			t7 = space();
    			td4 = element("td");
    			td4.textContent = "PIB 1T";
    			t9 = space();
    			td5 = element("td");
    			td5.textContent = "PIB 2T";
    			t11 = space();
    			td6 = element("td");
    			td6.textContent = "PIB 3T";
    			t13 = space();
    			td7 = element("td");
    			td7.textContent = "PIB 4T";
    			t15 = space();
    			td8 = element("td");
    			td8.textContent = "VPY";
    			t17 = space();
    			td9 = element("td");
    			td9.textContent = "ACTIONS";
    			t19 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td10 = element("td");
    			t20 = text(t20_value);
    			t21 = space();
    			td11 = element("td");
    			t22 = text(t22_value);
    			t23 = space();
    			td12 = element("td");
    			input0 = element("input");
    			t24 = space();
    			td13 = element("td");
    			input1 = element("input");
    			t25 = space();
    			td14 = element("td");
    			input2 = element("input");
    			t26 = space();
    			td15 = element("td");
    			input3 = element("input");
    			t27 = space();
    			td16 = element("td");
    			input4 = element("input");
    			t28 = space();
    			td17 = element("td");
    			input5 = element("input");
    			t29 = space();
    			td18 = element("td");
    			input6 = element("input");
    			t30 = space();
    			td19 = element("td");
    			create_component(button.$$.fragment);
    			add_location(td0, file$3, 77, 4, 2206);
    			add_location(td1, file$3, 78, 4, 2228);
    			add_location(td2, file$3, 79, 4, 2247);
    			add_location(td3, file$3, 80, 4, 2265);
    			add_location(td4, file$3, 81, 4, 2285);
    			add_location(td5, file$3, 82, 4, 2306);
    			add_location(td6, file$3, 83, 4, 2327);
    			add_location(td7, file$3, 84, 4, 2348);
    			add_location(td8, file$3, 85, 4, 2369);
    			add_location(td9, file$3, 86, 4, 2387);
    			add_location(tr0, file$3, 76, 3, 2196);
    			add_location(thead, file$3, 75, 2, 2184);
    			add_location(td10, file$3, 91, 4, 2451);
    			add_location(td11, file$3, 92, 4, 2479);
    			set_style(input0, "width", "100px");
    			add_location(input0, file$3, 93, 8, 2508);
    			add_location(td12, file$3, 93, 4, 2504);
    			set_style(input1, "width", "100px");
    			add_location(input1, file$3, 94, 8, 2578);
    			add_location(td13, file$3, 94, 4, 2574);
    			set_style(input2, "width", "100px");
    			add_location(input2, file$3, 95, 8, 2649);
    			add_location(td14, file$3, 95, 4, 2645);
    			set_style(input3, "width", "100px");
    			add_location(input3, file$3, 96, 8, 2721);
    			add_location(td15, file$3, 96, 4, 2717);
    			set_style(input4, "width", "100px");
    			add_location(input4, file$3, 97, 8, 2793);
    			add_location(td16, file$3, 97, 4, 2789);
    			set_style(input5, "width", "100px");
    			add_location(input5, file$3, 98, 8, 2865);
    			add_location(td17, file$3, 98, 4, 2861);
    			set_style(input6, "width", "50px");
    			add_location(input6, file$3, 99, 8, 2937);
    			add_location(td18, file$3, 99, 4, 2933);
    			add_location(td19, file$3, 100, 4, 3002);
    			add_location(tr1, file$3, 90, 3, 2441);
    			add_location(tbody, file$3, 89, 2, 2429);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, td0);
    			append_dev(tr0, t1);
    			append_dev(tr0, td1);
    			append_dev(tr0, t3);
    			append_dev(tr0, td2);
    			append_dev(tr0, t5);
    			append_dev(tr0, td3);
    			append_dev(tr0, t7);
    			append_dev(tr0, td4);
    			append_dev(tr0, t9);
    			append_dev(tr0, td5);
    			append_dev(tr0, t11);
    			append_dev(tr0, td6);
    			append_dev(tr0, t13);
    			append_dev(tr0, td7);
    			append_dev(tr0, t15);
    			append_dev(tr0, td8);
    			append_dev(tr0, t17);
    			append_dev(tr0, td9);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td10);
    			append_dev(td10, t20);
    			append_dev(tr1, t21);
    			append_dev(tr1, td11);
    			append_dev(td11, t22);
    			append_dev(tr1, t23);
    			append_dev(tr1, td12);
    			append_dev(td12, input0);
    			set_input_value(input0, /*updatedRPC*/ ctx[1]);
    			append_dev(tr1, t24);
    			append_dev(tr1, td13);
    			append_dev(td13, input1);
    			set_input_value(input1, /*updatedPiba*/ ctx[2]);
    			append_dev(tr1, t25);
    			append_dev(tr1, td14);
    			append_dev(td14, input2);
    			set_input_value(input2, /*updatedPib1t*/ ctx[3]);
    			append_dev(tr1, t26);
    			append_dev(tr1, td15);
    			append_dev(td15, input3);
    			set_input_value(input3, /*updatedPib2t*/ ctx[4]);
    			append_dev(tr1, t27);
    			append_dev(tr1, td16);
    			append_dev(td16, input4);
    			set_input_value(input4, /*updatedPib3t*/ ctx[5]);
    			append_dev(tr1, t28);
    			append_dev(tr1, td17);
    			append_dev(td17, input5);
    			set_input_value(input5, /*updatedPib4t*/ ctx[6]);
    			append_dev(tr1, t29);
    			append_dev(tr1, td18);
    			append_dev(td18, input6);
    			set_input_value(input6, /*updatedVpy*/ ctx[7]);
    			append_dev(tr1, t30);
    			append_dev(tr1, td19);
    			mount_component(button, td19, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[14]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[15]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[16]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[17]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[18]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[19]),
    				listen_dev(input6, "input", /*input6_input_handler*/ ctx[20])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*rpc*/ 512) && t20_value !== (t20_value = /*rpc*/ ctx[9].country + "")) set_data_dev(t20, t20_value);
    			if ((!current || dirty & /*rpc*/ 512) && t22_value !== (t22_value = /*rpc*/ ctx[9].year + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*updatedRPC*/ 2 && input0.value !== /*updatedRPC*/ ctx[1]) {
    				set_input_value(input0, /*updatedRPC*/ ctx[1]);
    			}

    			if (dirty & /*updatedPiba*/ 4 && input1.value !== /*updatedPiba*/ ctx[2]) {
    				set_input_value(input1, /*updatedPiba*/ ctx[2]);
    			}

    			if (dirty & /*updatedPib1t*/ 8 && input2.value !== /*updatedPib1t*/ ctx[3]) {
    				set_input_value(input2, /*updatedPib1t*/ ctx[3]);
    			}

    			if (dirty & /*updatedPib2t*/ 16 && input3.value !== /*updatedPib2t*/ ctx[4]) {
    				set_input_value(input3, /*updatedPib2t*/ ctx[4]);
    			}

    			if (dirty & /*updatedPib3t*/ 32 && input4.value !== /*updatedPib3t*/ ctx[5]) {
    				set_input_value(input4, /*updatedPib3t*/ ctx[5]);
    			}

    			if (dirty & /*updatedPib4t*/ 64 && input5.value !== /*updatedPib4t*/ ctx[6]) {
    				set_input_value(input5, /*updatedPib4t*/ ctx[6]);
    			}

    			if (dirty & /*updatedVpy*/ 128 && input6.value !== /*updatedVpy*/ ctx[7]) {
    				set_input_value(input6, /*updatedVpy*/ ctx[7]);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(tbody);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(75:1) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (73:13)  ;   {:then rpc}
    function create_pending_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(";");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(73:13)  ;   {:then rpc}",
    		ctx
    	});

    	return block;
    }

    // (107:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("VOLVER");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(107:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let h2;
    	let t0;
    	let t1_value = /*params*/ ctx[0].country + "";
    	let t1;
    	let t2;
    	let t3_value = /*params*/ ctx[0].year + "";
    	let t3;
    	let t4;
    	let t5;
    	let promise;
    	let t6;
    	let current;
    	let if_block = /*userMsg*/ ctx[8] && create_if_block$4(ctx);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 9,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*rpc*/ ctx[9], info);

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			t0 = text("Editing RPC from ");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			info.block.c();
    			t6 = space();
    			create_component(button.$$.fragment);
    			add_location(h2, file$3, 70, 4, 2015);
    			add_location(main, file$3, 69, 0, 2003);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			append_dev(h2, t4);
    			if (if_block) if_block.m(h2, null);
    			append_dev(main, t5);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t6;
    			append_dev(main, t6);
    			mount_component(button, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*params*/ 1) && t1_value !== (t1_value = /*params*/ ctx[0].country + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*params*/ 1) && t3_value !== (t3_value = /*params*/ ctx[0].year + "")) set_data_dev(t3, t3_value);

    			if (/*userMsg*/ ctx[8]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(h2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			info.ctx = ctx;

    			if (dirty & /*rpc*/ 512 && promise !== (promise = /*rpc*/ ctx[9]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[9] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { params = {} } = $$props;
    	let rpc = {};
    	let country;
    	let year;
    	let updatedRPC;
    	let updatedPiba;
    	let updatedPib1t;
    	let updatedPib2t;
    	let updatedPib3t;
    	let updatedPib4t;
    	let updatedVpy;
    	let userMsg;
    	onMount(getRPC);

    	async function getRPC() {
    		console.log("Fetching rpc..");
    		const res = await fetch("/api/v2/rents-per-capita/" + params.country + "/" + params.year);

    		if (res.ok) {
    			console.log("OK!");
    			const json = await res.json();
    			$$invalidate(9, rpc = json);
    			country = rpc.country;
    			year = rpc.year;
    			$$invalidate(1, updatedRPC = rpc.rpc);
    			$$invalidate(2, updatedPiba = rpc.piba);
    			$$invalidate(3, updatedPib1t = rpc.pib1t);
    			$$invalidate(4, updatedPib2t = rpc.pib2t);
    			$$invalidate(5, updatedPib3t = rpc.pib3t);
    			$$invalidate(6, updatedPib4t = rpc.pib4t);
    			$$invalidate(7, updatedVpy = rpc.vpy);
    			console.log("Received rpc.");
    		} else {
    			console.log("ERROR!!!");
    		}
    	}

    	async function updateRPC() {
    		console.log("Updating rpc from " + JSON.stringify(params.country) + " " + JSON.stringify(params.year));

    		const res = await fetch("/api/v2/rents-per-capita/" + params.country + "/" + params.year, {
    			method: "PUT",
    			body: JSON.stringify({
    				country,
    				year,
    				rpc: updatedRPC,
    				piba: updatedPiba,
    				pib1t: updatedPib1t,
    				pib2t: updatedPib2t,
    				pib3t: updatedPib3t,
    				pib4t: updatedPib4t,
    				vpy: updatedVpy
    			}),
    			headers: { "Content-Type": "application/json" }
    		}).then(function (res) {
    			$$invalidate(8, userMsg = "DATO ACTUALIZADO");
    		});
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<EditRpc> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("EditRpc", $$slots, []);

    	function input0_input_handler() {
    		updatedRPC = this.value;
    		$$invalidate(1, updatedRPC);
    	}

    	function input1_input_handler() {
    		updatedPiba = this.value;
    		$$invalidate(2, updatedPiba);
    	}

    	function input2_input_handler() {
    		updatedPib1t = this.value;
    		$$invalidate(3, updatedPib1t);
    	}

    	function input3_input_handler() {
    		updatedPib2t = this.value;
    		$$invalidate(4, updatedPib2t);
    	}

    	function input4_input_handler() {
    		updatedPib3t = this.value;
    		$$invalidate(5, updatedPib3t);
    	}

    	function input5_input_handler() {
    		updatedPib4t = this.value;
    		$$invalidate(6, updatedPib4t);
    	}

    	function input6_input_handler() {
    		updatedVpy = this.value;
    		$$invalidate(7, updatedVpy);
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Table,
    		Button,
    		pop,
    		params,
    		rpc,
    		country,
    		year,
    		updatedRPC,
    		updatedPiba,
    		updatedPib1t,
    		updatedPib2t,
    		updatedPib3t,
    		updatedPib4t,
    		updatedVpy,
    		userMsg,
    		getRPC,
    		updateRPC
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("rpc" in $$props) $$invalidate(9, rpc = $$props.rpc);
    		if ("country" in $$props) country = $$props.country;
    		if ("year" in $$props) year = $$props.year;
    		if ("updatedRPC" in $$props) $$invalidate(1, updatedRPC = $$props.updatedRPC);
    		if ("updatedPiba" in $$props) $$invalidate(2, updatedPiba = $$props.updatedPiba);
    		if ("updatedPib1t" in $$props) $$invalidate(3, updatedPib1t = $$props.updatedPib1t);
    		if ("updatedPib2t" in $$props) $$invalidate(4, updatedPib2t = $$props.updatedPib2t);
    		if ("updatedPib3t" in $$props) $$invalidate(5, updatedPib3t = $$props.updatedPib3t);
    		if ("updatedPib4t" in $$props) $$invalidate(6, updatedPib4t = $$props.updatedPib4t);
    		if ("updatedVpy" in $$props) $$invalidate(7, updatedVpy = $$props.updatedVpy);
    		if ("userMsg" in $$props) $$invalidate(8, userMsg = $$props.userMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		params,
    		updatedRPC,
    		updatedPiba,
    		updatedPib1t,
    		updatedPib2t,
    		updatedPib3t,
    		updatedPib4t,
    		updatedVpy,
    		userMsg,
    		rpc,
    		updateRPC,
    		country,
    		year,
    		getRPC,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler
    	];
    }

    class EditRpc extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditRpc",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get params() {
    		throw new Error("<EditRpc>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<EditRpc>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\rpc\RpcsGraph.svelte generated by Svelte v3.22.3 */

    const file$4 = "src\\front\\rpc\\RpcsGraph.svelte";

    function create_fragment$5(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let figure;
    	let div;
    	let t1;
    	let p;
    	let dispose;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			figure = element("figure");
    			div = element("div");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Packed bubble charts are visualizations where the size and optionally\r\n        the color of the bubbles are used to visualize the data. The positioning\r\n        of the bubbles is not significant, but is optimized for compactness.\r\n        Try dragging the bubbles in this chart around, and see the effects.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$4, 113, 8, 3166);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/highcharts-more.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$4, 114, 8, 3241);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$4, 115, 8, 3321);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$4, 116, 8, 3403);
    			attr_dev(div, "id", "container");
    			add_location(div, file$4, 120, 4, 3575);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$4, 121, 4, 3607);
    			attr_dev(figure, "class", "highcharts-figure");
    			add_location(figure, file$4, 119, 4, 3535);
    			add_location(main, file$4, 118, 0, 3523);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t1);
    			append_dev(figure, p);
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph, false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph() {
    	let CountriesData = [];
    	let EuropeCountries = [];
    	let AsiaCountries = [];
    	let AmericaCountries = [];
    	let AfricaCountries = [];
    	let OceaniaCountries = [];
    	const resData = await fetch("/api/v3/rents-per-capita");
    	CountriesData = await resData.json();

    	CountriesData.filter(data => data.continent == "Europe" && data.year == 2019).forEach(data => {
    		let country = { "name": data.country, "value": data.rpc };
    		EuropeCountries.push(country);
    	});

    	CountriesData.filter(data => data.continent == "Asia" && data.year == 2019).forEach(data => {
    		let country = { "name": data.country, "value": data.rpc };
    		AsiaCountries.push(country);
    	});

    	CountriesData.filter(data => data.continent == "America" && data.year == 2019).forEach(data => {
    		let country = { "name": data.country, "value": data.rpc };
    		AmericaCountries.push(country);
    	});

    	CountriesData.filter(data => data.continent == "Africa" && data.year == 2019).forEach(data => {
    		let country = { "name": data.country, "value": data.rpc };
    		AfricaCountries.push(country);
    	});

    	CountriesData.filter(data => data.continent == "Oceania" && data.year == 2019).forEach(data => {
    		let country = { "name": data.country, "value": data.rpc };
    		OceaniaCountries.push(country);
    	});

    	Highcharts.chart("container", {
    		chart: { type: "packedbubble", height: "100%" },
    		title: { text: "Rents per capita (2019)" },
    		tooltip: {
    			useHTML: true,
    			pointFormat: "<b>{point.name}:</b> {point.value} mill €"
    		},
    		plotOptions: {
    			packedbubble: {
    				minSize: "30%",
    				maxSize: "120%",
    				zMin: 0,
    				zMax: 1000000,
    				layoutAlgorithm: {
    					splitSeries: false,
    					gravitationalConstant: 0.02
    				},
    				dataLabels: {
    					enabled: true,
    					format: "{point.name}",
    					filter: {
    						property: "y",
    						operator: ">",
    						value: 10000
    					},
    					style: {
    						color: "black",
    						textOutline: "none",
    						fontWeight: "normal"
    					}
    				}
    			}
    		},
    		series: [
    			{ name: "Europe", data: EuropeCountries },
    			{ name: "Asia", data: AsiaCountries },
    			{ name: "Africa", data: AfricaCountries },
    			{ name: "America", data: AmericaCountries },
    			{ name: "Oceania", data: OceaniaCountries }
    		]
    	});
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RpcsGraph> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RpcsGraph", $$slots, []);
    	$$self.$capture_state = () => ({ loadGraph });
    	return [];
    }

    class RpcsGraph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RpcsGraph",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\front\index.svelte generated by Svelte v3.22.3 */

    const file$5 = "src\\front\\index.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let div;
    	let h1;
    	let t1;
    	let h20;
    	let t3;
    	let ul0;
    	let li0;
    	let a0;
    	let t5;
    	let li1;
    	let a1;
    	let t7;
    	let li2;
    	let a2;
    	let t9;
    	let h21;
    	let t11;
    	let ul1;
    	let li3;
    	let a3;
    	let t13;
    	let li4;
    	let a4;
    	let t15;
    	let li5;
    	let a5;
    	let t17;
    	let h22;
    	let t19;
    	let a6;
    	let t21;
    	let h23;
    	let t23;
    	let br;
    	let t24;
    	let ul2;
    	let li6;
    	let a7;
    	let t26;
    	let a8;
    	let t28;
    	let t29;
    	let li7;
    	let a9;
    	let a10;
    	let t32;
    	let t33;
    	let li8;
    	let a11;
    	let t35;
    	let a12;
    	let t37;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "SOS1920-11";
    			t1 = space();
    			h20 = element("h2");
    			h20.textContent = "Team";
    			t3 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Ignacio Calcedo Vázquez";
    			t5 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "José Calcedo Vázquez";
    			t7 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Alberto Rubio Hurtado";
    			t9 = space();
    			h21 = element("h2");
    			h21.textContent = "Project description:";
    			t11 = text(" \r\n\t\t\tOur project is focused on the economic freedom of different countries and the impact this has in their societies with this 3 parameters:\r\n\t\t");
    			ul1 = element("ul");
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Freedom Indexes";
    			t13 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "Crime Rates";
    			t15 = space();
    			li5 = element("li");
    			a5 = element("a");
    			a5.textContent = "Rents per Capita";
    			t17 = space();
    			h22 = element("h2");
    			h22.textContent = "URL";
    			t19 = space();
    			a6 = element("a");
    			a6.textContent = "http://sos1920-11.herokuapp.com";
    			t21 = space();
    			h23 = element("h2");
    			h23.textContent = "APIs";
    			t23 = text("\r\n\t\tPuedes examinar en Postman las distintas APIs que han generado cada uno de los miembros:\r\n\t\t");
    			br = element("br");
    			t24 = space();
    			ul2 = element("ul");
    			li6 = element("li");
    			a7 = element("a");
    			a7.textContent = "API V1";
    			t26 = text(" (Deprecated) // ");
    			a8 = element("a");
    			a8.textContent = "API V2";
    			t28 = text(" (developed by Ignacio Calcedo Vázquez)");
    			t29 = space();
    			li7 = element("li");
    			a9 = element("a");
    			a9.textContent = "API v1";
    			a10 = element("a");
    			a10.textContent = "API v2";
    			t32 = text(" (developed by José Calcedo Vázquez)");
    			t33 = space();
    			li8 = element("li");
    			a11 = element("a");
    			a11.textContent = "API RPC V1";
    			t35 = text(" (Deprecated) // ");
    			a12 = element("a");
    			a12.textContent = "RPC API v2";
    			t37 = text(" (developed by Alberto Rubio Hurtado)");
    			add_location(h1, file$5, 6, 2, 50);
    			add_location(h20, file$5, 10, 2, 85);
    			attr_dev(a0, "href", "https://github.com/IgnacioCVGitHub");
    			add_location(a0, file$5, 13, 7, 120);
    			add_location(li0, file$5, 13, 3, 116);
    			attr_dev(a1, "href", "https://github.com/JaredYeeto");
    			add_location(a1, file$5, 14, 7, 206);
    			add_location(li1, file$5, 14, 3, 202);
    			attr_dev(a2, "href", "https://github.com/arh09");
    			add_location(a2, file$5, 15, 7, 284);
    			add_location(li2, file$5, 15, 3, 280);
    			add_location(ul0, file$5, 12, 3, 107);
    			add_location(h21, file$5, 19, 2, 373);
    			attr_dev(a3, "href", "http://sos1920-11.herokuapp.com/#/efis");
    			add_location(a3, file$5, 24, 7, 569);
    			add_location(li3, file$5, 24, 3, 565);
    			attr_dev(a4, "href", "http://sos1920-11.herokuapp.com/#/crimes");
    			add_location(a4, file$5, 25, 7, 646);
    			add_location(li4, file$5, 25, 3, 642);
    			attr_dev(a5, "href", "http://sos1920-11.herokuapp.com/#/rpcs");
    			add_location(a5, file$5, 26, 7, 722);
    			add_location(li5, file$5, 26, 3, 718);
    			add_location(ul1, file$5, 23, 2, 556);
    			add_location(h22, file$5, 28, 2, 804);
    			attr_dev(a6, "href", "http://sos1920-11.herokuapp.com");
    			add_location(a6, file$5, 31, 3, 830);
    			add_location(h23, file$5, 32, 2, 911);
    			add_location(br, file$5, 36, 2, 1029);
    			attr_dev(a7, "href", "https://documenter.getpostman.com/view/10701438/SzYUZgNc");
    			add_location(a7, file$5, 38, 7, 1050);
    			attr_dev(a8, "href", "https://documenter.getpostman.com/view/10701438/SzmcbzBj");
    			add_location(a8, file$5, 38, 101, 1144);
    			add_location(li6, file$5, 38, 3, 1046);
    			attr_dev(a9, "href", " https://documenter.getpostman.com/view/10701451/Szf3aVio");
    			add_location(a9, file$5, 39, 7, 1274);
    			attr_dev(a10, "href", "https://documenter.getpostman.com/view/10701451/Szme4dYR");
    			add_location(a10, file$5, 39, 85, 1352);
    			add_location(li7, file$5, 39, 3, 1270);
    			attr_dev(a11, "href", "https://documenter.getpostman.com/view/9107347/Szme4dme");
    			add_location(a11, file$5, 40, 7, 1479);
    			attr_dev(a12, "href", "https://documenter.getpostman.com/view/9107347/SzYUa25s");
    			add_location(a12, file$5, 40, 104, 1576);
    			add_location(li8, file$5, 40, 3, 1475);
    			add_location(ul2, file$5, 37, 2, 1037);
    			attr_dev(div, "id", "");
    			add_location(div, file$5, 5, 1, 34);
    			add_location(main, file$5, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, h20);
    			append_dev(div, t3);
    			append_dev(div, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(ul0, t5);
    			append_dev(ul0, li1);
    			append_dev(li1, a1);
    			append_dev(ul0, t7);
    			append_dev(ul0, li2);
    			append_dev(li2, a2);
    			append_dev(div, t9);
    			append_dev(div, h21);
    			append_dev(div, t11);
    			append_dev(div, ul1);
    			append_dev(ul1, li3);
    			append_dev(li3, a3);
    			append_dev(li3, t13);
    			append_dev(ul1, li4);
    			append_dev(li4, a4);
    			append_dev(li4, t15);
    			append_dev(ul1, li5);
    			append_dev(li5, a5);
    			append_dev(div, t17);
    			append_dev(div, h22);
    			append_dev(div, t19);
    			append_dev(div, a6);
    			append_dev(div, t21);
    			append_dev(div, h23);
    			append_dev(div, t23);
    			append_dev(div, br);
    			append_dev(div, t24);
    			append_dev(div, ul2);
    			append_dev(ul2, li6);
    			append_dev(li6, a7);
    			append_dev(li6, t26);
    			append_dev(li6, a8);
    			append_dev(li6, t28);
    			append_dev(ul2, t29);
    			append_dev(ul2, li7);
    			append_dev(li7, a9);
    			append_dev(li7, a10);
    			append_dev(li7, t32);
    			append_dev(ul2, t33);
    			append_dev(ul2, li8);
    			append_dev(li8, a11);
    			append_dev(li8, t35);
    			append_dev(li8, a12);
    			append_dev(li8, t37);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Front> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Front", $$slots, []);
    	return [];
    }

    class Front extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Front",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\front\efi\efitable.svelte generated by Svelte v3.22.3 */

    const { Object: Object_1$1, console: console_1$3 } = globals;
    const file$6 = "src\\front\\efi\\efitable.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[51] = list[i];
    	return child_ctx;
    }

    // (219:20) <Button outline color="secondary" on:click={loadData}>
    function create_default_slot_9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cargar Datos iniciales");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(219:20) <Button outline color=\\\"secondary\\\" on:click={loadData}>",
    		ctx
    	});

    	return block;
    }

    // (220:20) <Button outline color="danger" on:click={delData}>
    function create_default_slot_8$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Borrar todo");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8$1.name,
    		type: "slot",
    		source: "(220:20) <Button outline color=\\\"danger\\\" on:click={delData}>",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import {    onMount   }
    function create_catch_block$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(1:0) <script>   import {    onMount   }",
    		ctx
    	});

    	return block;
    }

    // (226:1) {:then efis}
    function create_then_block$2(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let current_block_type_index;
    	let if_block0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let br0;
    	let t5;
    	let h3;
    	let t6;
    	let t7;
    	let br1;
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_5$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_1$1, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*busquedaEsp*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = !/*maxpag*/ ctx[14] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(table.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			t3 = text(/*numTotal*/ ctx[3]);
    			t4 = space();
    			br0 = element("br");
    			t5 = space();
    			h3 = element("h3");
    			t6 = text(/*userMsg*/ ctx[4]);
    			t7 = space();
    			br1 = element("br");
    			set_style(div0, "width", "auto");
    			set_style(div0, "width", "100%");
    			set_style(div0, "overflow-x", "auto");
    			set_style(div0, "white-space", "nowrap");
    			add_location(div0, file$6, 226, 4, 6466);
    			add_location(br0, file$6, 310, 8, 9718);
    			add_location(h3, file$6, 311, 8, 9732);
    			add_location(br1, file$6, 312, 8, 9760);
    			add_location(div1, file$6, 299, 8, 9322);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(table, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(div1, t1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, br0);
    			append_dev(div1, t5);
    			append_dev(div1, h3);
    			append_dev(h3, t6);
    			append_dev(div1, t7);
    			append_dev(div1, br1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};

    			if (dirty[0] & /*efis, newEfi*/ 33 | dirty[1] & /*$$scope*/ 8388608) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div1, t1);
    			}

    			if (!/*maxpag*/ ctx[14]) if_block1.p(ctx, dirty);
    			if (!current || dirty[0] & /*numTotal*/ 8) set_data_dev(t3, /*numTotal*/ ctx[3]);
    			if (!current || dirty[0] & /*userMsg*/ 16) set_data_dev(t6, /*userMsg*/ ctx[4]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(table);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(226:1) {:then efis}",
    		ctx
    	});

    	return block;
    }

    // (270:10) <Button outline  color="primary" on:click={insertaEfi}>
    function create_default_slot_7$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Insertar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7$1.name,
    		type: "slot",
    		source: "(270:10) <Button outline  color=\\\"primary\\\" on:click={insertaEfi}>",
    		ctx
    	});

    	return block;
    }

    // (293:10) <Button outline color="danger" on:click={deleteEfi(efi.country,efi.year)}>
    function create_default_slot_6$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Borrar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$1.name,
    		type: "slot",
    		source: "(293:10) <Button outline color=\\\"danger\\\" on:click={deleteEfi(efi.country,efi.year)}>",
    		ctx
    	});

    	return block;
    }

    // (273:4) {#each efis as efi}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let a;
    	let t0_value = /*efi*/ ctx[51].country + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let td1;
    	let t2_value = /*efi*/ ctx[51].year + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*efi*/ ctx[51].efiindex + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*efi*/ ctx[51].efigovint + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*efi*/ ctx[51].efipropright + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = /*efi*/ ctx[51].efijudefct + "";
    	let t10;
    	let t11;
    	let td6;
    	let t12_value = /*efi*/ ctx[51].efitaxburden + "";
    	let t12;
    	let t13;
    	let td7;
    	let t14_value = /*efi*/ ctx[51].efigovspend + "";
    	let t14;
    	let t15;
    	let td8;
    	let t16_value = /*efi*/ ctx[51].efisicalhealth + "";
    	let t16;
    	let t17;
    	let td9;
    	let t18_value = /*efi*/ ctx[51].efibusfreed + "";
    	let t18;
    	let t19;
    	let td10;
    	let t20_value = /*efi*/ ctx[51].efilabfreed + "";
    	let t20;
    	let t21;
    	let td11;
    	let t22_value = /*efi*/ ctx[51].efimonfreed + "";
    	let t22;
    	let t23;
    	let td12;
    	let t24_value = /*efi*/ ctx[51].efitradefreed + "";
    	let t24;
    	let t25;
    	let td13;
    	let t26_value = /*efi*/ ctx[51].efiinvfreed + "";
    	let t26;
    	let t27;
    	let td14;
    	let t28_value = /*efi*/ ctx[51].efifinfred + "";
    	let t28;
    	let t29;
    	let td15;
    	let t30;
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_6$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*deleteEfi*/ ctx[8](/*efi*/ ctx[51].country, /*efi*/ ctx[51].year))) /*deleteEfi*/ ctx[8](/*efi*/ ctx[51].country, /*efi*/ ctx[51].year).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td6 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td7 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			td8 = element("td");
    			t16 = text(t16_value);
    			t17 = space();
    			td9 = element("td");
    			t18 = text(t18_value);
    			t19 = space();
    			td10 = element("td");
    			t20 = text(t20_value);
    			t21 = space();
    			td11 = element("td");
    			t22 = text(t22_value);
    			t23 = space();
    			td12 = element("td");
    			t24 = text(t24_value);
    			t25 = space();
    			td13 = element("td");
    			t26 = text(t26_value);
    			t27 = space();
    			td14 = element("td");
    			t28 = text(t28_value);
    			t29 = space();
    			td15 = element("td");
    			create_component(button.$$.fragment);
    			t30 = space();
    			attr_dev(a, "href", a_href_value = "#/efis/" + /*efi*/ ctx[51].country + "/" + /*efi*/ ctx[51].year);
    			add_location(a, file$6, 275, 7, 8329);
    			add_location(td0, file$6, 274, 6, 8316);
    			add_location(td1, file$6, 278, 24, 8435);
    			add_location(td2, file$6, 279, 24, 8480);
    			add_location(td3, file$6, 280, 24, 8529);
    			add_location(td4, file$6, 281, 24, 8579);
    			add_location(td5, file$6, 282, 24, 8632);
    			add_location(td6, file$6, 283, 24, 8683);
    			add_location(td7, file$6, 284, 24, 8736);
    			add_location(td8, file$6, 285, 24, 8788);
    			add_location(td9, file$6, 286, 24, 8843);
    			add_location(td10, file$6, 287, 24, 8895);
    			add_location(td11, file$6, 288, 24, 8947);
    			add_location(td12, file$6, 289, 24, 8999);
    			add_location(td13, file$6, 290, 24, 9053);
    			add_location(td14, file$6, 291, 24, 9105);
    			add_location(td15, file$6, 292, 6, 9138);
    			add_location(tr, file$6, 273, 5, 8304);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, a);
    			append_dev(a, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td6);
    			append_dev(td6, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td7);
    			append_dev(td7, t14);
    			append_dev(tr, t15);
    			append_dev(tr, td8);
    			append_dev(td8, t16);
    			append_dev(tr, t17);
    			append_dev(tr, td9);
    			append_dev(td9, t18);
    			append_dev(tr, t19);
    			append_dev(tr, td10);
    			append_dev(td10, t20);
    			append_dev(tr, t21);
    			append_dev(tr, td11);
    			append_dev(td11, t22);
    			append_dev(tr, t23);
    			append_dev(tr, td12);
    			append_dev(td12, t24);
    			append_dev(tr, t25);
    			append_dev(tr, td13);
    			append_dev(td13, t26);
    			append_dev(tr, t27);
    			append_dev(tr, td14);
    			append_dev(td14, t28);
    			append_dev(tr, t29);
    			append_dev(tr, td15);
    			mount_component(button, td15, null);
    			append_dev(tr, t30);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*efis*/ 32) && t0_value !== (t0_value = /*efi*/ ctx[51].country + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*efis*/ 32 && a_href_value !== (a_href_value = "#/efis/" + /*efi*/ ctx[51].country + "/" + /*efi*/ ctx[51].year)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if ((!current || dirty[0] & /*efis*/ 32) && t2_value !== (t2_value = /*efi*/ ctx[51].year + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t4_value !== (t4_value = /*efi*/ ctx[51].efiindex + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t6_value !== (t6_value = /*efi*/ ctx[51].efigovint + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t8_value !== (t8_value = /*efi*/ ctx[51].efipropright + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t10_value !== (t10_value = /*efi*/ ctx[51].efijudefct + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t12_value !== (t12_value = /*efi*/ ctx[51].efitaxburden + "")) set_data_dev(t12, t12_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t14_value !== (t14_value = /*efi*/ ctx[51].efigovspend + "")) set_data_dev(t14, t14_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t16_value !== (t16_value = /*efi*/ ctx[51].efisicalhealth + "")) set_data_dev(t16, t16_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t18_value !== (t18_value = /*efi*/ ctx[51].efibusfreed + "")) set_data_dev(t18, t18_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t20_value !== (t20_value = /*efi*/ ctx[51].efilabfreed + "")) set_data_dev(t20, t20_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t22_value !== (t22_value = /*efi*/ ctx[51].efimonfreed + "")) set_data_dev(t22, t22_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t24_value !== (t24_value = /*efi*/ ctx[51].efitradefreed + "")) set_data_dev(t24, t24_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t26_value !== (t26_value = /*efi*/ ctx[51].efiinvfreed + "")) set_data_dev(t26, t26_value);
    			if ((!current || dirty[0] & /*efis*/ 32) && t28_value !== (t28_value = /*efi*/ ctx[51].efifinfred + "")) set_data_dev(t28, t28_value);
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(273:4) {#each efis as efi}",
    		ctx
    	});

    	return block;
    }

    // (231:2) <Table bordered>
    function create_default_slot_5$1(ctx) {
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let th5;
    	let t11;
    	let th6;
    	let t13;
    	let th7;
    	let t15;
    	let th8;
    	let t17;
    	let th9;
    	let t19;
    	let th10;
    	let t21;
    	let th11;
    	let t23;
    	let th12;
    	let t25;
    	let th13;
    	let t27;
    	let th14;
    	let t29;
    	let th15;
    	let t31;
    	let tbody;
    	let tr1;
    	let td0;
    	let input0;
    	let t32;
    	let td1;
    	let input1;
    	let t33;
    	let td2;
    	let input2;
    	let t34;
    	let td3;
    	let input3;
    	let t35;
    	let td4;
    	let input4;
    	let t36;
    	let td5;
    	let input5;
    	let t37;
    	let td6;
    	let input6;
    	let t38;
    	let td7;
    	let input7;
    	let t39;
    	let td8;
    	let input8;
    	let t40;
    	let td9;
    	let input9;
    	let t41;
    	let td10;
    	let input10;
    	let t42;
    	let td11;
    	let input11;
    	let t43;
    	let td12;
    	let input12;
    	let t44;
    	let td13;
    	let input13;
    	let t45;
    	let td14;
    	let input14;
    	let t46;
    	let td15;
    	let t47;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_7$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*insertaEfi*/ ctx[7]);
    	let each_value = /*efis*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "country";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "year";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "efiindex";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "efigovint";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "efipropright";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "efijudefct";
    			t11 = space();
    			th6 = element("th");
    			th6.textContent = "efitaxburden";
    			t13 = space();
    			th7 = element("th");
    			th7.textContent = "efigovspend";
    			t15 = space();
    			th8 = element("th");
    			th8.textContent = "efifiscalhealth";
    			t17 = space();
    			th9 = element("th");
    			th9.textContent = "efibusfreed";
    			t19 = space();
    			th10 = element("th");
    			th10.textContent = "efilabfreed";
    			t21 = space();
    			th11 = element("th");
    			th11.textContent = "efimonfreed";
    			t23 = space();
    			th12 = element("th");
    			th12.textContent = "efitradefreed";
    			t25 = space();
    			th13 = element("th");
    			th13.textContent = "efiinvfreed";
    			t27 = space();
    			th14 = element("th");
    			th14.textContent = "efifinfreed";
    			t29 = space();
    			th15 = element("th");
    			th15.textContent = "Acciones";
    			t31 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			input0 = element("input");
    			t32 = space();
    			td1 = element("td");
    			input1 = element("input");
    			t33 = space();
    			td2 = element("td");
    			input2 = element("input");
    			t34 = space();
    			td3 = element("td");
    			input3 = element("input");
    			t35 = space();
    			td4 = element("td");
    			input4 = element("input");
    			t36 = space();
    			td5 = element("td");
    			input5 = element("input");
    			t37 = space();
    			td6 = element("td");
    			input6 = element("input");
    			t38 = space();
    			td7 = element("td");
    			input7 = element("input");
    			t39 = space();
    			td8 = element("td");
    			input8 = element("input");
    			t40 = space();
    			td9 = element("td");
    			input9 = element("input");
    			t41 = space();
    			td10 = element("td");
    			input10 = element("input");
    			t42 = space();
    			td11 = element("td");
    			input11 = element("input");
    			t43 = space();
    			td12 = element("td");
    			input12 = element("input");
    			t44 = space();
    			td13 = element("td");
    			input13 = element("input");
    			t45 = space();
    			td14 = element("td");
    			input14 = element("input");
    			t46 = space();
    			td15 = element("td");
    			create_component(button.$$.fragment);
    			t47 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(th0, file$6, 233, 5, 6607);
    			add_location(th1, file$6, 234, 5, 6630);
    			add_location(th2, file$6, 235, 5, 6650);
    			add_location(th3, file$6, 236, 20, 6689);
    			add_location(th4, file$6, 237, 20, 6729);
    			add_location(th5, file$6, 238, 20, 6772);
    			add_location(th6, file$6, 239, 20, 6813);
    			add_location(th7, file$6, 240, 20, 6856);
    			add_location(th8, file$6, 241, 20, 6898);
    			add_location(th9, file$6, 242, 20, 6944);
    			add_location(th10, file$6, 243, 20, 6986);
    			add_location(th11, file$6, 244, 20, 7028);
    			add_location(th12, file$6, 245, 20, 7070);
    			add_location(th13, file$6, 246, 20, 7114);
    			add_location(th14, file$6, 247, 20, 7156);
    			add_location(th15, file$6, 248, 5, 7183);
    			add_location(tr0, file$6, 232, 4, 6596);
    			add_location(thead, file$6, 231, 3, 6583);
    			add_location(input0, file$6, 253, 9, 7257);
    			add_location(td0, file$6, 253, 5, 7253);
    			add_location(input1, file$6, 254, 9, 7310);
    			add_location(td1, file$6, 254, 5, 7306);
    			add_location(input2, file$6, 255, 24, 7375);
    			add_location(td2, file$6, 255, 20, 7371);
    			add_location(input3, file$6, 256, 9, 7429);
    			add_location(td3, file$6, 256, 5, 7425);
    			add_location(input4, file$6, 257, 24, 7499);
    			add_location(td4, file$6, 257, 20, 7495);
    			add_location(input5, file$6, 258, 9, 7557);
    			add_location(td5, file$6, 258, 5, 7553);
    			add_location(input6, file$6, 259, 9, 7613);
    			add_location(td6, file$6, 259, 5, 7609);
    			add_location(input7, file$6, 260, 24, 7686);
    			add_location(td7, file$6, 260, 20, 7682);
    			add_location(input8, file$6, 261, 9, 7743);
    			add_location(td8, file$6, 261, 5, 7739);
    			add_location(input9, file$6, 262, 9, 7803);
    			add_location(td9, file$6, 262, 5, 7799);
    			add_location(input10, file$6, 263, 24, 7875);
    			add_location(td10, file$6, 263, 20, 7871);
    			add_location(input11, file$6, 264, 9, 7932);
    			add_location(td11, file$6, 264, 5, 7928);
    			add_location(input12, file$6, 265, 9, 7989);
    			add_location(td12, file$6, 265, 5, 7985);
    			add_location(input13, file$6, 266, 24, 8063);
    			add_location(td13, file$6, 266, 20, 8059);
    			add_location(input14, file$6, 267, 9, 8120);
    			add_location(td14, file$6, 267, 5, 8116);
    			add_location(td15, file$6, 269, 5, 8176);
    			add_location(tr1, file$6, 252, 4, 7242);
    			add_location(tbody, file$6, 251, 3, 7229);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(tr0, t5);
    			append_dev(tr0, th3);
    			append_dev(tr0, t7);
    			append_dev(tr0, th4);
    			append_dev(tr0, t9);
    			append_dev(tr0, th5);
    			append_dev(tr0, t11);
    			append_dev(tr0, th6);
    			append_dev(tr0, t13);
    			append_dev(tr0, th7);
    			append_dev(tr0, t15);
    			append_dev(tr0, th8);
    			append_dev(tr0, t17);
    			append_dev(tr0, th9);
    			append_dev(tr0, t19);
    			append_dev(tr0, th10);
    			append_dev(tr0, t21);
    			append_dev(tr0, th11);
    			append_dev(tr0, t23);
    			append_dev(tr0, th12);
    			append_dev(tr0, t25);
    			append_dev(tr0, th13);
    			append_dev(tr0, t27);
    			append_dev(tr0, th14);
    			append_dev(tr0, t29);
    			append_dev(tr0, th15);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, input0);
    			set_input_value(input0, /*newEfi*/ ctx[0].country);
    			append_dev(tr1, t32);
    			append_dev(tr1, td1);
    			append_dev(td1, input1);
    			set_input_value(input1, /*newEfi*/ ctx[0].year);
    			append_dev(tr1, t33);
    			append_dev(tr1, td2);
    			append_dev(td2, input2);
    			set_input_value(input2, /*newEfi*/ ctx[0].efiindex);
    			append_dev(tr1, t34);
    			append_dev(tr1, td3);
    			append_dev(td3, input3);
    			set_input_value(input3, /*newEfi*/ ctx[0].efigovint);
    			append_dev(tr1, t35);
    			append_dev(tr1, td4);
    			append_dev(td4, input4);
    			set_input_value(input4, /*newEfi*/ ctx[0].efipropright);
    			append_dev(tr1, t36);
    			append_dev(tr1, td5);
    			append_dev(td5, input5);
    			set_input_value(input5, /*newEfi*/ ctx[0].efijudefct);
    			append_dev(tr1, t37);
    			append_dev(tr1, td6);
    			append_dev(td6, input6);
    			set_input_value(input6, /*newEfi*/ ctx[0].efitaxburden);
    			append_dev(tr1, t38);
    			append_dev(tr1, td7);
    			append_dev(td7, input7);
    			set_input_value(input7, /*newEfi*/ ctx[0].efigovspend);
    			append_dev(tr1, t39);
    			append_dev(tr1, td8);
    			append_dev(td8, input8);
    			set_input_value(input8, /*newEfi*/ ctx[0].efisicalhealth);
    			append_dev(tr1, t40);
    			append_dev(tr1, td9);
    			append_dev(td9, input9);
    			set_input_value(input9, /*newEfi*/ ctx[0].efibusfreed);
    			append_dev(tr1, t41);
    			append_dev(tr1, td10);
    			append_dev(td10, input10);
    			set_input_value(input10, /*newEfi*/ ctx[0].efilabfreed);
    			append_dev(tr1, t42);
    			append_dev(tr1, td11);
    			append_dev(td11, input11);
    			set_input_value(input11, /*newEfi*/ ctx[0].efimonfreed);
    			append_dev(tr1, t43);
    			append_dev(tr1, td12);
    			append_dev(td12, input12);
    			set_input_value(input12, /*newEfi*/ ctx[0].efitradefreed);
    			append_dev(tr1, t44);
    			append_dev(tr1, td13);
    			append_dev(td13, input13);
    			set_input_value(input13, /*newEfi*/ ctx[0].efiinvfreed);
    			append_dev(tr1, t45);
    			append_dev(tr1, td14);
    			append_dev(td14, input14);
    			set_input_value(input14, /*newEfi*/ ctx[0].efifinfred);
    			append_dev(tr1, t46);
    			append_dev(tr1, td15);
    			mount_component(button, td15, null);
    			append_dev(tbody, t47);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[21]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[22]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[23]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[24]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[25]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[26]),
    				listen_dev(input6, "input", /*input6_input_handler*/ ctx[27]),
    				listen_dev(input7, "input", /*input7_input_handler*/ ctx[28]),
    				listen_dev(input8, "input", /*input8_input_handler*/ ctx[29]),
    				listen_dev(input9, "input", /*input9_input_handler*/ ctx[30]),
    				listen_dev(input10, "input", /*input10_input_handler*/ ctx[31]),
    				listen_dev(input11, "input", /*input11_input_handler*/ ctx[32]),
    				listen_dev(input12, "input", /*input12_input_handler*/ ctx[33]),
    				listen_dev(input13, "input", /*input13_input_handler*/ ctx[34]),
    				listen_dev(input14, "input", /*input14_input_handler*/ ctx[35])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newEfi*/ 1 && input0.value !== /*newEfi*/ ctx[0].country) {
    				set_input_value(input0, /*newEfi*/ ctx[0].country);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input1.value !== /*newEfi*/ ctx[0].year) {
    				set_input_value(input1, /*newEfi*/ ctx[0].year);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input2.value !== /*newEfi*/ ctx[0].efiindex) {
    				set_input_value(input2, /*newEfi*/ ctx[0].efiindex);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input3.value !== /*newEfi*/ ctx[0].efigovint) {
    				set_input_value(input3, /*newEfi*/ ctx[0].efigovint);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input4.value !== /*newEfi*/ ctx[0].efipropright) {
    				set_input_value(input4, /*newEfi*/ ctx[0].efipropright);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input5.value !== /*newEfi*/ ctx[0].efijudefct) {
    				set_input_value(input5, /*newEfi*/ ctx[0].efijudefct);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input6.value !== /*newEfi*/ ctx[0].efitaxburden) {
    				set_input_value(input6, /*newEfi*/ ctx[0].efitaxburden);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input7.value !== /*newEfi*/ ctx[0].efigovspend) {
    				set_input_value(input7, /*newEfi*/ ctx[0].efigovspend);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input8.value !== /*newEfi*/ ctx[0].efisicalhealth) {
    				set_input_value(input8, /*newEfi*/ ctx[0].efisicalhealth);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input9.value !== /*newEfi*/ ctx[0].efibusfreed) {
    				set_input_value(input9, /*newEfi*/ ctx[0].efibusfreed);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input10.value !== /*newEfi*/ ctx[0].efilabfreed) {
    				set_input_value(input10, /*newEfi*/ ctx[0].efilabfreed);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input11.value !== /*newEfi*/ ctx[0].efimonfreed) {
    				set_input_value(input11, /*newEfi*/ ctx[0].efimonfreed);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input12.value !== /*newEfi*/ ctx[0].efitradefreed) {
    				set_input_value(input12, /*newEfi*/ ctx[0].efitradefreed);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input13.value !== /*newEfi*/ ctx[0].efiinvfreed) {
    				set_input_value(input13, /*newEfi*/ ctx[0].efiinvfreed);
    			}

    			if (dirty[0] & /*newEfi*/ 1 && input14.value !== /*newEfi*/ ctx[0].efifinfred) {
    				set_input_value(input14, /*newEfi*/ ctx[0].efifinfred);
    			}

    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty[0] & /*deleteEfi, efis*/ 288) {
    				each_value = /*efis*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(tbody);
    			destroy_component(button);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$1.name,
    		type: "slot",
    		source: "(231:2) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (304:8) {:else}
    function create_else_block$3(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*beforeOffset*/ ctx[12]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(304:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (301:8) {#if busquedaEsp}
    function create_if_block_1$1(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*reset*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(301:8) {#if busquedaEsp}",
    		ctx
    	});

    	return block;
    }

    // (305:8) <Button outline color="secondary" on:click={beforeOffset}>
    function create_default_slot_4$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("ANTERIOR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(305:8) <Button outline color=\\\"secondary\\\" on:click={beforeOffset}>",
    		ctx
    	});

    	return block;
    }

    // (303:12) <Button outline color="secondary" on:click={reset}>
    function create_default_slot_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Restaurar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(303:12) <Button outline color=\\\"secondary\\\" on:click={reset}>",
    		ctx
    	});

    	return block;
    }

    // (307:8) {#if !maxpag}
    function create_if_block$5(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*nextOffset*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 8388608) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(307:8) {#if !maxpag}",
    		ctx
    	});

    	return block;
    }

    // (308:5) <Button outline color="secondary" on:click={nextOffset}>
    function create_default_slot_2$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SIGUIENTE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(308:5) <Button outline color=\\\"secondary\\\" on:click={nextOffset}>",
    		ctx
    	});

    	return block;
    }

    // (225:14)        {:then efis}
    function create_pending_block$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(225:14)        {:then efis}",
    		ctx
    	});

    	return block;
    }

    // (322:4) <Table bordered style="width: auto;">
    function create_default_slot_1$2(ctx) {
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let th5;
    	let t11;
    	let th6;
    	let t13;
    	let th7;
    	let t15;
    	let th8;
    	let t17;
    	let th9;
    	let t19;
    	let th10;
    	let t21;
    	let th11;
    	let t23;
    	let th12;
    	let t25;
    	let th13;
    	let t27;
    	let th14;
    	let t29;
    	let tbody;
    	let tr1;
    	let td0;
    	let input0;
    	let t30;
    	let td1;
    	let input1;
    	let t31;
    	let td2;
    	let input2;
    	let t32;
    	let td3;
    	let input3;
    	let t33;
    	let td4;
    	let input4;
    	let t34;
    	let td5;
    	let input5;
    	let t35;
    	let td6;
    	let input6;
    	let t36;
    	let td7;
    	let input7;
    	let t37;
    	let td8;
    	let input8;
    	let t38;
    	let td9;
    	let input9;
    	let t39;
    	let td10;
    	let input10;
    	let t40;
    	let td11;
    	let input11;
    	let t41;
    	let td12;
    	let input12;
    	let t42;
    	let td13;
    	let input13;
    	let t43;
    	let td14;
    	let input14;
    	let dispose;

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "country";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "year";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "efiindex";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "efigovint";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "efipropright";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "efijudefct";
    			t11 = space();
    			th6 = element("th");
    			th6.textContent = "efitaxburden";
    			t13 = space();
    			th7 = element("th");
    			th7.textContent = "efigovspend";
    			t15 = space();
    			th8 = element("th");
    			th8.textContent = "efifiscalhealth";
    			t17 = space();
    			th9 = element("th");
    			th9.textContent = "efibusfreed";
    			t19 = space();
    			th10 = element("th");
    			th10.textContent = "efilabfreed";
    			t21 = space();
    			th11 = element("th");
    			th11.textContent = "efimonfreed";
    			t23 = space();
    			th12 = element("th");
    			th12.textContent = "efitradefreed";
    			t25 = space();
    			th13 = element("th");
    			th13.textContent = "efiinvfreed";
    			t27 = space();
    			th14 = element("th");
    			th14.textContent = "efifinfreed";
    			t29 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			input0 = element("input");
    			t30 = space();
    			td1 = element("td");
    			input1 = element("input");
    			t31 = space();
    			td2 = element("td");
    			input2 = element("input");
    			t32 = space();
    			td3 = element("td");
    			input3 = element("input");
    			t33 = space();
    			td4 = element("td");
    			input4 = element("input");
    			t34 = space();
    			td5 = element("td");
    			input5 = element("input");
    			t35 = space();
    			td6 = element("td");
    			input6 = element("input");
    			t36 = space();
    			td7 = element("td");
    			input7 = element("input");
    			t37 = space();
    			td8 = element("td");
    			input8 = element("input");
    			t38 = space();
    			td9 = element("td");
    			input9 = element("input");
    			t39 = space();
    			td10 = element("td");
    			input10 = element("input");
    			t40 = space();
    			td11 = element("td");
    			input11 = element("input");
    			t41 = space();
    			td12 = element("td");
    			input12 = element("input");
    			t42 = space();
    			td13 = element("td");
    			input13 = element("input");
    			t43 = space();
    			td14 = element("td");
    			input14 = element("input");
    			add_location(th0, file$6, 324, 4, 9969);
    			add_location(th1, file$6, 325, 16, 10003);
    			add_location(th2, file$6, 326, 16, 10034);
    			add_location(th3, file$6, 327, 16, 10069);
    			add_location(th4, file$6, 328, 16, 10105);
    			add_location(th5, file$6, 329, 16, 10144);
    			add_location(th6, file$6, 330, 16, 10181);
    			add_location(th7, file$6, 331, 16, 10220);
    			add_location(th8, file$6, 332, 16, 10258);
    			add_location(th9, file$6, 333, 16, 10300);
    			add_location(th10, file$6, 334, 16, 10338);
    			add_location(th11, file$6, 335, 16, 10376);
    			add_location(th12, file$6, 336, 16, 10414);
    			add_location(th13, file$6, 337, 16, 10454);
    			add_location(th14, file$6, 338, 16, 10492);
    			add_location(tr0, file$6, 323, 3, 9959);
    			add_location(thead, file$6, 322, 2, 9947);
    			add_location(input0, file$6, 343, 20, 10576);
    			add_location(td0, file$6, 343, 16, 10572);
    			add_location(input1, file$6, 344, 20, 10642);
    			add_location(td1, file$6, 344, 16, 10638);
    			add_location(input2, file$6, 345, 20, 10705);
    			add_location(td2, file$6, 345, 16, 10701);
    			add_location(input3, file$6, 346, 20, 10772);
    			add_location(td3, file$6, 346, 16, 10768);
    			add_location(input4, file$6, 347, 20, 10840);
    			add_location(td4, file$6, 347, 16, 10836);
    			add_location(input5, file$6, 348, 20, 10911);
    			add_location(td5, file$6, 348, 16, 10907);
    			add_location(input6, file$6, 349, 20, 10980);
    			add_location(td6, file$6, 349, 16, 10976);
    			add_location(input7, file$6, 350, 20, 11051);
    			add_location(td7, file$6, 350, 16, 11047);
    			add_location(input8, file$6, 351, 20, 11121);
    			add_location(td8, file$6, 351, 16, 11117);
    			add_location(input9, file$6, 352, 20, 11194);
    			add_location(td9, file$6, 352, 16, 11190);
    			add_location(input10, file$6, 353, 20, 11264);
    			add_location(td10, file$6, 353, 16, 11260);
    			add_location(input11, file$6, 354, 20, 11334);
    			add_location(td11, file$6, 354, 16, 11330);
    			add_location(input12, file$6, 355, 20, 11404);
    			add_location(td12, file$6, 355, 16, 11400);
    			add_location(input13, file$6, 356, 20, 11476);
    			add_location(td13, file$6, 356, 16, 11472);
    			add_location(input14, file$6, 357, 20, 11546);
    			add_location(td14, file$6, 357, 16, 11542);
    			add_location(tr1, file$6, 342, 3, 10550);
    			add_location(tbody, file$6, 341, 2, 10538);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(tr0, t5);
    			append_dev(tr0, th3);
    			append_dev(tr0, t7);
    			append_dev(tr0, th4);
    			append_dev(tr0, t9);
    			append_dev(tr0, th5);
    			append_dev(tr0, t11);
    			append_dev(tr0, th6);
    			append_dev(tr0, t13);
    			append_dev(tr0, th7);
    			append_dev(tr0, t15);
    			append_dev(tr0, th8);
    			append_dev(tr0, t17);
    			append_dev(tr0, th9);
    			append_dev(tr0, t19);
    			append_dev(tr0, th10);
    			append_dev(tr0, t21);
    			append_dev(tr0, th11);
    			append_dev(tr0, t23);
    			append_dev(tr0, th12);
    			append_dev(tr0, t25);
    			append_dev(tr0, th13);
    			append_dev(tr0, t27);
    			append_dev(tr0, th14);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, input0);
    			set_input_value(input0, /*queryEfi*/ ctx[1].country);
    			append_dev(tr1, t30);
    			append_dev(tr1, td1);
    			append_dev(td1, input1);
    			set_input_value(input1, /*queryEfi*/ ctx[1].year);
    			append_dev(tr1, t31);
    			append_dev(tr1, td2);
    			append_dev(td2, input2);
    			set_input_value(input2, /*queryEfi*/ ctx[1].efiindex);
    			append_dev(tr1, t32);
    			append_dev(tr1, td3);
    			append_dev(td3, input3);
    			set_input_value(input3, /*queryEfi*/ ctx[1].efigovint);
    			append_dev(tr1, t33);
    			append_dev(tr1, td4);
    			append_dev(td4, input4);
    			set_input_value(input4, /*queryEfi*/ ctx[1].efipropright);
    			append_dev(tr1, t34);
    			append_dev(tr1, td5);
    			append_dev(td5, input5);
    			set_input_value(input5, /*queryEfi*/ ctx[1].efijudefct);
    			append_dev(tr1, t35);
    			append_dev(tr1, td6);
    			append_dev(td6, input6);
    			set_input_value(input6, /*queryEfi*/ ctx[1].efitaxburden);
    			append_dev(tr1, t36);
    			append_dev(tr1, td7);
    			append_dev(td7, input7);
    			set_input_value(input7, /*queryEfi*/ ctx[1].efigovspend);
    			append_dev(tr1, t37);
    			append_dev(tr1, td8);
    			append_dev(td8, input8);
    			set_input_value(input8, /*queryEfi*/ ctx[1].efisicalhealth);
    			append_dev(tr1, t38);
    			append_dev(tr1, td9);
    			append_dev(td9, input9);
    			set_input_value(input9, /*queryEfi*/ ctx[1].efibusfreed);
    			append_dev(tr1, t39);
    			append_dev(tr1, td10);
    			append_dev(td10, input10);
    			set_input_value(input10, /*queryEfi*/ ctx[1].efilabfreed);
    			append_dev(tr1, t40);
    			append_dev(tr1, td11);
    			append_dev(td11, input11);
    			set_input_value(input11, /*queryEfi*/ ctx[1].efimonfreed);
    			append_dev(tr1, t41);
    			append_dev(tr1, td12);
    			append_dev(td12, input12);
    			set_input_value(input12, /*queryEfi*/ ctx[1].efitradefreed);
    			append_dev(tr1, t42);
    			append_dev(tr1, td13);
    			append_dev(td13, input13);
    			set_input_value(input13, /*queryEfi*/ ctx[1].efiinvfreed);
    			append_dev(tr1, t43);
    			append_dev(tr1, td14);
    			append_dev(td14, input14);
    			set_input_value(input14, /*queryEfi*/ ctx[1].efifinfred);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[36]),
    				listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[37]),
    				listen_dev(input2, "input", /*input2_input_handler_1*/ ctx[38]),
    				listen_dev(input3, "input", /*input3_input_handler_1*/ ctx[39]),
    				listen_dev(input4, "input", /*input4_input_handler_1*/ ctx[40]),
    				listen_dev(input5, "input", /*input5_input_handler_1*/ ctx[41]),
    				listen_dev(input6, "input", /*input6_input_handler_1*/ ctx[42]),
    				listen_dev(input7, "input", /*input7_input_handler_1*/ ctx[43]),
    				listen_dev(input8, "input", /*input8_input_handler_1*/ ctx[44]),
    				listen_dev(input9, "input", /*input9_input_handler_1*/ ctx[45]),
    				listen_dev(input10, "input", /*input10_input_handler_1*/ ctx[46]),
    				listen_dev(input11, "input", /*input11_input_handler_1*/ ctx[47]),
    				listen_dev(input12, "input", /*input12_input_handler_1*/ ctx[48]),
    				listen_dev(input13, "input", /*input13_input_handler_1*/ ctx[49]),
    				listen_dev(input14, "input", /*input14_input_handler_1*/ ctx[50])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*queryEfi*/ 2 && input0.value !== /*queryEfi*/ ctx[1].country) {
    				set_input_value(input0, /*queryEfi*/ ctx[1].country);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input1.value !== /*queryEfi*/ ctx[1].year) {
    				set_input_value(input1, /*queryEfi*/ ctx[1].year);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input2.value !== /*queryEfi*/ ctx[1].efiindex) {
    				set_input_value(input2, /*queryEfi*/ ctx[1].efiindex);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input3.value !== /*queryEfi*/ ctx[1].efigovint) {
    				set_input_value(input3, /*queryEfi*/ ctx[1].efigovint);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input4.value !== /*queryEfi*/ ctx[1].efipropright) {
    				set_input_value(input4, /*queryEfi*/ ctx[1].efipropright);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input5.value !== /*queryEfi*/ ctx[1].efijudefct) {
    				set_input_value(input5, /*queryEfi*/ ctx[1].efijudefct);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input6.value !== /*queryEfi*/ ctx[1].efitaxburden) {
    				set_input_value(input6, /*queryEfi*/ ctx[1].efitaxburden);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input7.value !== /*queryEfi*/ ctx[1].efigovspend) {
    				set_input_value(input7, /*queryEfi*/ ctx[1].efigovspend);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input8.value !== /*queryEfi*/ ctx[1].efisicalhealth) {
    				set_input_value(input8, /*queryEfi*/ ctx[1].efisicalhealth);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input9.value !== /*queryEfi*/ ctx[1].efibusfreed) {
    				set_input_value(input9, /*queryEfi*/ ctx[1].efibusfreed);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input10.value !== /*queryEfi*/ ctx[1].efilabfreed) {
    				set_input_value(input10, /*queryEfi*/ ctx[1].efilabfreed);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input11.value !== /*queryEfi*/ ctx[1].efimonfreed) {
    				set_input_value(input11, /*queryEfi*/ ctx[1].efimonfreed);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input12.value !== /*queryEfi*/ ctx[1].efitradefreed) {
    				set_input_value(input12, /*queryEfi*/ ctx[1].efitradefreed);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input13.value !== /*queryEfi*/ ctx[1].efiinvfreed) {
    				set_input_value(input13, /*queryEfi*/ ctx[1].efiinvfreed);
    			}

    			if (dirty[0] & /*queryEfi*/ 2 && input14.value !== /*queryEfi*/ ctx[1].efifinfred) {
    				set_input_value(input14, /*queryEfi*/ ctx[1].efifinfred);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(tbody);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(322:4) <Table bordered style=\\\"width: auto;\\\">",
    		ctx
    	});

    	return block;
    }

    // (364:4) <Button outline color="secondary" on:click={searchefi}>
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("BUSCAR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(364:4) <Button outline color=\\\"secondary\\\" on:click={searchefi}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let div0;
    	let table0;
    	let tbody;
    	let tr0;
    	let t0;
    	let tr1;
    	let t1;
    	let promise;
    	let t2;
    	let div1;
    	let t3;
    	let current;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*loadData*/ ctx[9]);

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_8$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*delData*/ ctx[10]);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 5,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*efis*/ ctx[5], info);

    	const table1 = new Table({
    			props: {
    				bordered: true,
    				style: "width: auto;",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", /*searchefi*/ ctx[6]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			table0 = element("table");
    			tbody = element("tbody");
    			tr0 = element("tr");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			tr1 = element("tr");
    			create_component(button1.$$.fragment);
    			t1 = space();
    			info.block.c();
    			t2 = space();
    			div1 = element("div");
    			create_component(table1.$$.fragment);
    			t3 = space();
    			create_component(button2.$$.fragment);
    			add_location(tr0, file$6, 218, 16, 6164);
    			add_location(tr1, file$6, 219, 16, 6276);
    			add_location(tbody, file$6, 217, 12, 6139);
    			add_location(table0, file$6, 216, 8, 6118);
    			add_location(div0, file$6, 215, 5, 6103);
    			set_style(div1, "width", "auto");
    			set_style(div1, "width", "100%");
    			set_style(div1, "overflow-x", "auto");
    			set_style(div1, "white-space", "nowrap");
    			add_location(div1, file$6, 316, 4, 9806);
    			add_location(main, file$6, 214, 0, 6090);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, table0);
    			append_dev(table0, tbody);
    			append_dev(tbody, tr0);
    			mount_component(button0, tr0, null);
    			append_dev(tbody, t0);
    			append_dev(tbody, tr1);
    			mount_component(button1, tr1, null);
    			append_dev(main, t1);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t2;
    			append_dev(main, t2);
    			append_dev(main, div1);
    			mount_component(table1, div1, null);
    			append_dev(main, t3);
    			mount_component(button2, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 8388608) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 8388608) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			info.ctx = ctx;

    			if (dirty[0] & /*efis*/ 32 && promise !== (promise = /*efis*/ ctx[5]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[5] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			const table1_changes = {};

    			if (dirty[0] & /*queryEfi*/ 2 | dirty[1] & /*$$scope*/ 8388608) {
    				table1_changes.$$scope = { dirty, ctx };
    			}

    			table1.$set(table1_changes);
    			const button2_changes = {};

    			if (dirty[1] & /*$$scope*/ 8388608) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(info.block);
    			transition_in(table1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(table1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(button0);
    			destroy_component(button1);
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(table1);
    			destroy_component(button2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let efis = [];

    	let newEfi = {
    		country: "",
    		year: 0,
    		efiindex: 0,
    		efigovint: 0,
    		efipropright: 0,
    		efijudefct: 0,
    		efitaxburden: 0,
    		efigovspend: 0,
    		efisicalhealth: 0,
    		efibusfreed: 0,
    		efilabfreed: 0,
    		efimonfreed: 0,
    		efitradefreed: 0,
    		efiinvfreed: 0,
    		efifinfred: 0
    	};

    	let queryEfi = {
    		country: "",
    		year: "",
    		efiindex: "",
    		efigovint: "",
    		efipropright: "",
    		efijudefct: "",
    		efitaxburden: "",
    		efigovspend: "",
    		efisicalhealth: "",
    		efibusfreed: "",
    		efilabfreed: "",
    		efimonfreed: "",
    		efitradefreed: "",
    		efiinvfreed: "",
    		efifinfred: ""
    	};

    	let busquedaEsp = false;
    	let queryEntera = "";

    	async function searchefi() {
    		var campos = new Map(Object.entries(queryEfi).filter(o => {
    				return o[1] != "";
    			}));

    		let queryaux = "?";

    		for (var [clave, valor] of campos.entries()) {
    			queryaux += clave + "=" + valor + "&";
    		}

    		queryEntera = queryaux.slice(0, -1);

    		if (queryEntera != "") {
    			console.log("Buscando contactos");
    			const res = await fetch("/api/v2/economic-freedom-indexes" + queryEntera);

    			if (res.ok) {
    				console.log("Ok:");
    				const json = await res.json();
    				$$invalidate(5, efis = json);
    				console.log("Recibidos " + efis.length + " efis.");
    				$$invalidate(3, numTotal = efis.length);
    				$$invalidate(4, userMsg = "Busqueda realizada correctamente");
    				$$invalidate(2, busquedaEsp = true);
    			} else {
    				$$invalidate(5, efis = []);

    				if (userMsg != "se ha borrado correctamente") {
    					$$invalidate(4, userMsg = "No se han encontrado datos.");
    				}

    				console.log("ERROR!");
    			}
    		} else {
    			getEfis();
    		}
    	}

    	let offset = 0;
    	let limit = 10;
    	let numTotal;
    	let numFiltered;
    	let userMsg = "";
    	onMount(getEfis);

    	async function getEfis() {
    		$$invalidate(2, busquedaEsp = false);
    		console.log("Buscando contactos");
    		const res = await fetch("/api/v2/economic-freedom-indexes?limit=" + limit + "&offset=" + offset);

    		if (res.ok) {
    			console.log("Ok:");
    			const json = await res.json();
    			$$invalidate(5, efis = json);
    			console.log("Recibidos " + efis.length + " efis.");
    			$$invalidate(3, numTotal = efis.length);
    		} else {
    			$$invalidate(5, efis = []);

    			if (userMsg != "se ha borrado correctamente") {
    				$$invalidate(4, userMsg = "No se han encontrado datos.");
    			}

    			console.log("ERROR!");
    		}
    	}

    	let entradas = Object.entries(newEfi).map(c => {
    		return c[0];
    	});

    	async function insertaEfi() {
    		$$invalidate(2, busquedaEsp = false);
    		($$invalidate(0, newEfi.year = parseInt(newEfi.year), newEfi), $$invalidate(0, newEfi.efiindex = parseFloat(newEfi.efiindex), newEfi), $$invalidate(0, newEfi.efigovint = parseFloat(newEfi.efigovint), newEfi), $$invalidate(0, newEfi.efipropright = parseFloat(newEfi.efipropright), newEfi), $$invalidate(0, newEfi.efijudefct = parseFloat(newEfi.efijudefct), newEfi), $$invalidate(0, newEfi.efitaxburden = parseFloat(newEfi.efitaxburden), newEfi), $$invalidate(0, newEfi.efigovspend = parseFloat(newEfi.efigovspend), newEfi), $$invalidate(0, newEfi.efisicalhealth = parseFloat(newEfi.efisicalhealth), newEfi), $$invalidate(0, newEfi.efibusfreed = parseFloat(newEfi.efibusfreed), newEfi), $$invalidate(0, newEfi.efilabfreed = parseFloat(newEfi.efilabfreed), newEfi), $$invalidate(0, newEfi.efimonfreed = parseFloat(newEfi.efimonfreed), newEfi), $$invalidate(0, newEfi.efitradefreed = parseFloat(newEfi.efitradefreed), newEfi), $$invalidate(0, newEfi.efiinvfreed = parseFloat(newEfi.efiinvfreed), newEfi), $$invalidate(0, newEfi.efifinfred = parseFloat(newEfi.efifinfred), newEfi));

    		const res = await fetch("/api/v2/economic-freedom-indexes/", {
    			method: "POST",
    			body: JSON.stringify(newEfi),
    			headers: { "Content-Type": "application/json" }
    		}).then(function (res) {
    			getEfis();

    			if (res.status == 201) {
    				console.log(entradas);
    				$$invalidate(4, userMsg = "EFI creado correctamente");
    			} else {
    				$$invalidate(4, userMsg = "el EFI no se creado correctamente...");
    			}
    		});
    	}

    	async function deleteEfi(country, year) {
    		$$invalidate(2, busquedaEsp = false);
    		console.log(country);
    		console.log(year);

    		const res = await fetch("/api/v2/economic-freedom-indexes/" + country + "/" + year, { method: "DELETE" }).then(function (res) {
    			if (res.status != 404) {
    				$$invalidate(4, userMsg = "se ha borrado correctamente");
    				getEfis();
    			} else {
    				$$invalidate(4, userMsg = "no se ha borrado correctamente");
    			}
    		});
    	}

    	async function loadData() {
    		$$invalidate(2, busquedaEsp = false);
    		const res = await fetch("/api/v2/economic-freedom-indexes/loadInitialData");
    		$$invalidate(4, userMsg = "Datos iniciales cargados");

    		if (res.ok) {
    			getEfis();
    		} else {
    			$$invalidate(5, efis = []);
    			$$invalidate(4, userMsg = "No se han encontrado datos.");
    			console.log("ERROR!");
    		}
    	}

    	async function delData() {
    		$$invalidate(2, busquedaEsp = false);

    		const res = await fetch("/api/v2/economic-freedom-indexes/", { method: "DELETE" }).then(function (res) {
    			if (res.status != 404) {
    				$$invalidate(4, userMsg = "se ha borrado correctamente");
    				getEfis();
    			} else {
    				$$invalidate(4, userMsg = "no se ha todo borrado correctamente");
    			}
    		});
    	}

    	async function reset() {
    		limit = 10;
    		offset = 0;
    		getEfis();
    	}

    	

    	async function beforeOffset() {
    		if (offset >= 10) offset = offset - limit;
    		getEfis();
    	}

    	async function nextOffset() {
    		if (offset + limit <= numTotal) offset = offset + limit;
    		getEfis();
    	}

    	let maxpag = numTotal >= limit;
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Efitable> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Efitable", $$slots, []);

    	function input0_input_handler() {
    		newEfi.country = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input1_input_handler() {
    		newEfi.year = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input2_input_handler() {
    		newEfi.efiindex = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input3_input_handler() {
    		newEfi.efigovint = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input4_input_handler() {
    		newEfi.efipropright = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input5_input_handler() {
    		newEfi.efijudefct = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input6_input_handler() {
    		newEfi.efitaxburden = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input7_input_handler() {
    		newEfi.efigovspend = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input8_input_handler() {
    		newEfi.efisicalhealth = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input9_input_handler() {
    		newEfi.efibusfreed = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input10_input_handler() {
    		newEfi.efilabfreed = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input11_input_handler() {
    		newEfi.efimonfreed = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input12_input_handler() {
    		newEfi.efitradefreed = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input13_input_handler() {
    		newEfi.efiinvfreed = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input14_input_handler() {
    		newEfi.efifinfred = this.value;
    		$$invalidate(0, newEfi);
    	}

    	function input0_input_handler_1() {
    		queryEfi.country = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input1_input_handler_1() {
    		queryEfi.year = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input2_input_handler_1() {
    		queryEfi.efiindex = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input3_input_handler_1() {
    		queryEfi.efigovint = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input4_input_handler_1() {
    		queryEfi.efipropright = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input5_input_handler_1() {
    		queryEfi.efijudefct = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input6_input_handler_1() {
    		queryEfi.efitaxburden = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input7_input_handler_1() {
    		queryEfi.efigovspend = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input8_input_handler_1() {
    		queryEfi.efisicalhealth = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input9_input_handler_1() {
    		queryEfi.efibusfreed = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input10_input_handler_1() {
    		queryEfi.efilabfreed = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input11_input_handler_1() {
    		queryEfi.efimonfreed = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input12_input_handler_1() {
    		queryEfi.efitradefreed = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input13_input_handler_1() {
    		queryEfi.efiinvfreed = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	function input14_input_handler_1() {
    		queryEfi.efifinfred = this.value;
    		$$invalidate(1, queryEfi);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Table,
    		Button,
    		efis,
    		newEfi,
    		queryEfi,
    		busquedaEsp,
    		queryEntera,
    		searchefi,
    		offset,
    		limit,
    		numTotal,
    		numFiltered,
    		userMsg,
    		getEfis,
    		entradas,
    		insertaEfi,
    		deleteEfi,
    		loadData,
    		delData,
    		reset,
    		beforeOffset,
    		nextOffset,
    		maxpag
    	});

    	$$self.$inject_state = $$props => {
    		if ("efis" in $$props) $$invalidate(5, efis = $$props.efis);
    		if ("newEfi" in $$props) $$invalidate(0, newEfi = $$props.newEfi);
    		if ("queryEfi" in $$props) $$invalidate(1, queryEfi = $$props.queryEfi);
    		if ("busquedaEsp" in $$props) $$invalidate(2, busquedaEsp = $$props.busquedaEsp);
    		if ("queryEntera" in $$props) queryEntera = $$props.queryEntera;
    		if ("offset" in $$props) offset = $$props.offset;
    		if ("limit" in $$props) limit = $$props.limit;
    		if ("numTotal" in $$props) $$invalidate(3, numTotal = $$props.numTotal);
    		if ("numFiltered" in $$props) numFiltered = $$props.numFiltered;
    		if ("userMsg" in $$props) $$invalidate(4, userMsg = $$props.userMsg);
    		if ("entradas" in $$props) entradas = $$props.entradas;
    		if ("maxpag" in $$props) $$invalidate(14, maxpag = $$props.maxpag);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		newEfi,
    		queryEfi,
    		busquedaEsp,
    		numTotal,
    		userMsg,
    		efis,
    		searchefi,
    		insertaEfi,
    		deleteEfi,
    		loadData,
    		delData,
    		reset,
    		beforeOffset,
    		nextOffset,
    		maxpag,
    		queryEntera,
    		offset,
    		limit,
    		numFiltered,
    		getEfis,
    		entradas,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input9_input_handler,
    		input10_input_handler,
    		input11_input_handler,
    		input12_input_handler,
    		input13_input_handler,
    		input14_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		input2_input_handler_1,
    		input3_input_handler_1,
    		input4_input_handler_1,
    		input5_input_handler_1,
    		input6_input_handler_1,
    		input7_input_handler_1,
    		input8_input_handler_1,
    		input9_input_handler_1,
    		input10_input_handler_1,
    		input11_input_handler_1,
    		input12_input_handler_1,
    		input13_input_handler_1,
    		input14_input_handler_1
    	];
    }

    class Efitable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Efitable",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\front\efi\editefi.svelte generated by Svelte v3.22.3 */

    const { console: console_1$4 } = globals;
    const file$7 = "src\\front\\efi\\editefi.svelte";

    // (1:0) <script>        import {onMount}
    function create_catch_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0) <script>        import {onMount}",
    		ctx
    	});

    	return block;
    }

    // (101:0) {:then efi}
    function create_then_block$3(ctx) {
    	let div;
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(table.$$.fragment);
    			set_style(div, "width", "auto");
    			set_style(div, "width", "100%");
    			set_style(div, "overflow-x", "auto");
    			set_style(div, "white-space", "nowrap");
    			add_location(div, file$7, 101, 0, 3570);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(table, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};

    			if (dirty[0] & /*updateefifinfred, updateefiinvfreed, updateefitradefreed, updateefimonfreed, updateefilabfreed, updateefibusfreed, updateefisicalhealth, updateefigovspend, updateefitaxburden, updateefijudefct, updateefipropright, updateefigovint, updateefiindex, updateyear, updatecountry*/ 65534 | dirty[1] & /*$$scope*/ 4) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(table);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(101:0) {:then efi}",
    		ctx
    	});

    	return block;
    }

    // (146:21) <Button outline  color="primary" on:click={updateEfi}>
    function create_default_slot_2$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Actualiza");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(146:21) <Button outline  color=\\\"primary\\\" on:click={updateEfi}>",
    		ctx
    	});

    	return block;
    }

    // (107:4) <Table bordered>
    function create_default_slot_1$3(ctx) {
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let th5;
    	let t11;
    	let th6;
    	let t13;
    	let th7;
    	let t15;
    	let th8;
    	let t17;
    	let th9;
    	let t19;
    	let th10;
    	let t21;
    	let th11;
    	let t23;
    	let th12;
    	let t25;
    	let th13;
    	let t27;
    	let th14;
    	let t29;
    	let th15;
    	let t31;
    	let tbody;
    	let tr1;
    	let td0;
    	let t32;
    	let t33;
    	let td1;
    	let t34;
    	let t35;
    	let td2;
    	let input0;
    	let t36;
    	let td3;
    	let input1;
    	let t37;
    	let td4;
    	let input2;
    	let t38;
    	let td5;
    	let input3;
    	let t39;
    	let td6;
    	let input4;
    	let t40;
    	let td7;
    	let input5;
    	let t41;
    	let td8;
    	let input6;
    	let t42;
    	let td9;
    	let input7;
    	let t43;
    	let td10;
    	let input8;
    	let t44;
    	let td11;
    	let input9;
    	let t45;
    	let td12;
    	let input10;
    	let t46;
    	let td13;
    	let input11;
    	let t47;
    	let td14;
    	let input12;
    	let t48;
    	let td15;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*updateEfi*/ ctx[18]);

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "country";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "year";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "efiindex";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "efigovint";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "efipropright";
    			t9 = space();
    			th5 = element("th");
    			th5.textContent = "efijudefct";
    			t11 = space();
    			th6 = element("th");
    			th6.textContent = "efitaxburden";
    			t13 = space();
    			th7 = element("th");
    			th7.textContent = "efigovspend";
    			t15 = space();
    			th8 = element("th");
    			th8.textContent = "efifiscalhealth";
    			t17 = space();
    			th9 = element("th");
    			th9.textContent = "efibusfreed";
    			t19 = space();
    			th10 = element("th");
    			th10.textContent = "efilabfreed";
    			t21 = space();
    			th11 = element("th");
    			th11.textContent = "efimonfreed";
    			t23 = space();
    			th12 = element("th");
    			th12.textContent = "efitradefreed";
    			t25 = space();
    			th13 = element("th");
    			th13.textContent = "efiinvfreed";
    			t27 = space();
    			th14 = element("th");
    			th14.textContent = "efifinfreed";
    			t29 = space();
    			th15 = element("th");
    			th15.textContent = "Acciones";
    			t31 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			t32 = text(/*updatecountry*/ ctx[1]);
    			t33 = space();
    			td1 = element("td");
    			t34 = text(/*updateyear*/ ctx[2]);
    			t35 = space();
    			td2 = element("td");
    			input0 = element("input");
    			t36 = space();
    			td3 = element("td");
    			input1 = element("input");
    			t37 = space();
    			td4 = element("td");
    			input2 = element("input");
    			t38 = space();
    			td5 = element("td");
    			input3 = element("input");
    			t39 = space();
    			td6 = element("td");
    			input4 = element("input");
    			t40 = space();
    			td7 = element("td");
    			input5 = element("input");
    			t41 = space();
    			td8 = element("td");
    			input6 = element("input");
    			t42 = space();
    			td9 = element("td");
    			input7 = element("input");
    			t43 = space();
    			td10 = element("td");
    			input8 = element("input");
    			t44 = space();
    			td11 = element("td");
    			input9 = element("input");
    			t45 = space();
    			td12 = element("td");
    			input10 = element("input");
    			t46 = space();
    			td13 = element("td");
    			input11 = element("input");
    			t47 = space();
    			td14 = element("td");
    			input12 = element("input");
    			t48 = space();
    			td15 = element("td");
    			create_component(button.$$.fragment);
    			add_location(th0, file$7, 109, 16, 3739);
    			add_location(th1, file$7, 110, 16, 3773);
    			add_location(th2, file$7, 111, 16, 3804);
    			add_location(th3, file$7, 112, 16, 3839);
    			add_location(th4, file$7, 113, 16, 3875);
    			add_location(th5, file$7, 114, 16, 3914);
    			add_location(th6, file$7, 115, 16, 3951);
    			add_location(th7, file$7, 116, 16, 3990);
    			add_location(th8, file$7, 117, 16, 4028);
    			add_location(th9, file$7, 118, 16, 4070);
    			add_location(th10, file$7, 119, 16, 4108);
    			add_location(th11, file$7, 120, 16, 4146);
    			add_location(th12, file$7, 121, 16, 4184);
    			add_location(th13, file$7, 122, 16, 4224);
    			add_location(th14, file$7, 123, 16, 4262);
    			add_location(th15, file$7, 124, 16, 4300);
    			add_location(tr0, file$7, 108, 12, 3717);
    			add_location(thead, file$7, 107, 8, 3696);
    			add_location(td0, file$7, 129, 16, 4407);
    			add_location(td1, file$7, 130, 16, 4449);
    			add_location(input0, file$7, 131, 20, 4492);
    			add_location(td2, file$7, 131, 16, 4488);
    			add_location(input1, file$7, 132, 20, 4556);
    			add_location(td3, file$7, 132, 16, 4552);
    			add_location(input2, file$7, 133, 20, 4621);
    			add_location(td4, file$7, 133, 16, 4617);
    			add_location(input3, file$7, 134, 20, 4689);
    			add_location(td5, file$7, 134, 16, 4685);
    			add_location(input4, file$7, 135, 20, 4755);
    			add_location(td6, file$7, 135, 16, 4751);
    			add_location(input5, file$7, 136, 20, 4823);
    			add_location(td7, file$7, 136, 16, 4819);
    			add_location(input6, file$7, 137, 20, 4890);
    			add_location(td8, file$7, 137, 16, 4886);
    			add_location(input7, file$7, 138, 20, 4960);
    			add_location(td9, file$7, 138, 16, 4956);
    			add_location(input8, file$7, 139, 20, 5027);
    			add_location(td10, file$7, 139, 16, 5023);
    			add_location(input9, file$7, 140, 20, 5094);
    			add_location(td11, file$7, 140, 16, 5090);
    			add_location(input10, file$7, 141, 20, 5161);
    			add_location(td12, file$7, 141, 16, 5157);
    			add_location(input11, file$7, 142, 20, 5230);
    			add_location(td13, file$7, 142, 16, 5226);
    			add_location(input12, file$7, 143, 20, 5297);
    			add_location(td14, file$7, 143, 16, 5293);
    			add_location(td15, file$7, 145, 16, 5365);
    			add_location(tr1, file$7, 128, 12, 4385);
    			add_location(tbody, file$7, 127, 8, 4364);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(tr0, t5);
    			append_dev(tr0, th3);
    			append_dev(tr0, t7);
    			append_dev(tr0, th4);
    			append_dev(tr0, t9);
    			append_dev(tr0, th5);
    			append_dev(tr0, t11);
    			append_dev(tr0, th6);
    			append_dev(tr0, t13);
    			append_dev(tr0, th7);
    			append_dev(tr0, t15);
    			append_dev(tr0, th8);
    			append_dev(tr0, t17);
    			append_dev(tr0, th9);
    			append_dev(tr0, t19);
    			append_dev(tr0, th10);
    			append_dev(tr0, t21);
    			append_dev(tr0, th11);
    			append_dev(tr0, t23);
    			append_dev(tr0, th12);
    			append_dev(tr0, t25);
    			append_dev(tr0, th13);
    			append_dev(tr0, t27);
    			append_dev(tr0, th14);
    			append_dev(tr0, t29);
    			append_dev(tr0, th15);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, t32);
    			append_dev(tr1, t33);
    			append_dev(tr1, td1);
    			append_dev(td1, t34);
    			append_dev(tr1, t35);
    			append_dev(tr1, td2);
    			append_dev(td2, input0);
    			set_input_value(input0, /*updateefiindex*/ ctx[3]);
    			append_dev(tr1, t36);
    			append_dev(tr1, td3);
    			append_dev(td3, input1);
    			set_input_value(input1, /*updateefigovint*/ ctx[4]);
    			append_dev(tr1, t37);
    			append_dev(tr1, td4);
    			append_dev(td4, input2);
    			set_input_value(input2, /*updateefipropright*/ ctx[5]);
    			append_dev(tr1, t38);
    			append_dev(tr1, td5);
    			append_dev(td5, input3);
    			set_input_value(input3, /*updateefijudefct*/ ctx[6]);
    			append_dev(tr1, t39);
    			append_dev(tr1, td6);
    			append_dev(td6, input4);
    			set_input_value(input4, /*updateefitaxburden*/ ctx[7]);
    			append_dev(tr1, t40);
    			append_dev(tr1, td7);
    			append_dev(td7, input5);
    			set_input_value(input5, /*updateefigovspend*/ ctx[8]);
    			append_dev(tr1, t41);
    			append_dev(tr1, td8);
    			append_dev(td8, input6);
    			set_input_value(input6, /*updateefisicalhealth*/ ctx[9]);
    			append_dev(tr1, t42);
    			append_dev(tr1, td9);
    			append_dev(td9, input7);
    			set_input_value(input7, /*updateefibusfreed*/ ctx[10]);
    			append_dev(tr1, t43);
    			append_dev(tr1, td10);
    			append_dev(td10, input8);
    			set_input_value(input8, /*updateefilabfreed*/ ctx[11]);
    			append_dev(tr1, t44);
    			append_dev(tr1, td11);
    			append_dev(td11, input9);
    			set_input_value(input9, /*updateefimonfreed*/ ctx[12]);
    			append_dev(tr1, t45);
    			append_dev(tr1, td12);
    			append_dev(td12, input10);
    			set_input_value(input10, /*updateefitradefreed*/ ctx[13]);
    			append_dev(tr1, t46);
    			append_dev(tr1, td13);
    			append_dev(td13, input11);
    			set_input_value(input11, /*updateefiinvfreed*/ ctx[14]);
    			append_dev(tr1, t47);
    			append_dev(tr1, td14);
    			append_dev(td14, input12);
    			set_input_value(input12, /*updateefifinfred*/ ctx[15]);
    			append_dev(tr1, t48);
    			append_dev(tr1, td15);
    			mount_component(button, td15, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[20]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[21]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[22]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[23]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[24]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[25]),
    				listen_dev(input6, "input", /*input6_input_handler*/ ctx[26]),
    				listen_dev(input7, "input", /*input7_input_handler*/ ctx[27]),
    				listen_dev(input8, "input", /*input8_input_handler*/ ctx[28]),
    				listen_dev(input9, "input", /*input9_input_handler*/ ctx[29]),
    				listen_dev(input10, "input", /*input10_input_handler*/ ctx[30]),
    				listen_dev(input11, "input", /*input11_input_handler*/ ctx[31]),
    				listen_dev(input12, "input", /*input12_input_handler*/ ctx[32])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*updatecountry*/ 2) set_data_dev(t32, /*updatecountry*/ ctx[1]);
    			if (!current || dirty[0] & /*updateyear*/ 4) set_data_dev(t34, /*updateyear*/ ctx[2]);

    			if (dirty[0] & /*updateefiindex*/ 8 && input0.value !== /*updateefiindex*/ ctx[3]) {
    				set_input_value(input0, /*updateefiindex*/ ctx[3]);
    			}

    			if (dirty[0] & /*updateefigovint*/ 16 && input1.value !== /*updateefigovint*/ ctx[4]) {
    				set_input_value(input1, /*updateefigovint*/ ctx[4]);
    			}

    			if (dirty[0] & /*updateefipropright*/ 32 && input2.value !== /*updateefipropright*/ ctx[5]) {
    				set_input_value(input2, /*updateefipropright*/ ctx[5]);
    			}

    			if (dirty[0] & /*updateefijudefct*/ 64 && input3.value !== /*updateefijudefct*/ ctx[6]) {
    				set_input_value(input3, /*updateefijudefct*/ ctx[6]);
    			}

    			if (dirty[0] & /*updateefitaxburden*/ 128 && input4.value !== /*updateefitaxburden*/ ctx[7]) {
    				set_input_value(input4, /*updateefitaxburden*/ ctx[7]);
    			}

    			if (dirty[0] & /*updateefigovspend*/ 256 && input5.value !== /*updateefigovspend*/ ctx[8]) {
    				set_input_value(input5, /*updateefigovspend*/ ctx[8]);
    			}

    			if (dirty[0] & /*updateefisicalhealth*/ 512 && input6.value !== /*updateefisicalhealth*/ ctx[9]) {
    				set_input_value(input6, /*updateefisicalhealth*/ ctx[9]);
    			}

    			if (dirty[0] & /*updateefibusfreed*/ 1024 && input7.value !== /*updateefibusfreed*/ ctx[10]) {
    				set_input_value(input7, /*updateefibusfreed*/ ctx[10]);
    			}

    			if (dirty[0] & /*updateefilabfreed*/ 2048 && input8.value !== /*updateefilabfreed*/ ctx[11]) {
    				set_input_value(input8, /*updateefilabfreed*/ ctx[11]);
    			}

    			if (dirty[0] & /*updateefimonfreed*/ 4096 && input9.value !== /*updateefimonfreed*/ ctx[12]) {
    				set_input_value(input9, /*updateefimonfreed*/ ctx[12]);
    			}

    			if (dirty[0] & /*updateefitradefreed*/ 8192 && input10.value !== /*updateefitradefreed*/ ctx[13]) {
    				set_input_value(input10, /*updateefitradefreed*/ ctx[13]);
    			}

    			if (dirty[0] & /*updateefiinvfreed*/ 16384 && input11.value !== /*updateefiinvfreed*/ ctx[14]) {
    				set_input_value(input11, /*updateefiinvfreed*/ ctx[14]);
    			}

    			if (dirty[0] & /*updateefifinfred*/ 32768 && input12.value !== /*updateefifinfred*/ ctx[15]) {
    				set_input_value(input12, /*updateefifinfred*/ ctx[15]);
    			}

    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 4) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(tbody);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(107:4) <Table bordered>",
    		ctx
    	});

    	return block;
    }

    // (99:12)     {:then efi}
    function create_pending_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(99:12)     {:then efi}",
    		ctx
    	});

    	return block;
    }

    // (152:4) {#if msg}
    function create_if_block$6(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*msg*/ ctx[16]);
    			set_style(p, "color", "red");
    			add_location(p, file$7, 152, 8, 5542);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*msg*/ 65536) set_data_dev(t, /*msg*/ ctx[16]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(152:4) {#if msg}",
    		ctx
    	});

    	return block;
    }

    // (155:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Atrás");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(155:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let main;
    	let h2;
    	let t0;
    	let t1_value = /*params*/ ctx[0].country + "";
    	let t1;
    	let t2;
    	let t3_value = /*params*/ ctx[0].year + "";
    	let t3;
    	let t4;
    	let promise;
    	let t5;
    	let t6;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 17,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*efi*/ ctx[17], info);
    	let if_block = /*msg*/ ctx[16] && create_if_block$6(ctx);

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			t0 = text("Editando EFI del pais ");
    			t1 = text(t1_value);
    			t2 = text(" y año ");
    			t3 = text(t3_value);
    			t4 = space();
    			info.block.c();
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			create_component(button.$$.fragment);
    			add_location(h2, file$7, 97, 0, 3472);
    			add_location(main, file$7, 96, 0, 3464);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			append_dev(main, t4);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t5;
    			append_dev(main, t5);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t6);
    			mount_component(button, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*params*/ 1) && t1_value !== (t1_value = /*params*/ ctx[0].country + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty[0] & /*params*/ 1) && t3_value !== (t3_value = /*params*/ ctx[0].year + "")) set_data_dev(t3, t3_value);
    			info.ctx = ctx;

    			if (dirty[0] & /*efi*/ 131072 && promise !== (promise = /*efi*/ ctx[17]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[17] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*msg*/ ctx[16]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(main, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 4) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (if_block) if_block.d();
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { params = {} } = $$props;
    	let efi = {};
    	let updatecountry;
    	let updateyear;
    	let updateefiindex;
    	let updateefigovint;
    	let updateefipropright;
    	let updateefijudefct;
    	let updateefitaxburden;
    	let updateefigovspend;
    	let updateefisicalhealth;
    	let updateefibusfreed;
    	let updateefilabfreed;
    	let updateefimonfreed;
    	let updateefitradefreed;
    	let updateefiinvfreed;
    	let updateefifinfred;
    	let msg;
    	onMount(getEfi);

    	async function getEfi() {
    		console.log("Fetching efi ...");
    		const res = await fetch("/api/v2/economic-freedom-indexes/" + params.country + "/" + params.year);

    		if (res.ok) {
    			console.log("OK!");
    			const json = await res.json();
    			$$invalidate(17, efi = json);
    			$$invalidate(1, updatecountry = efi.country);
    			$$invalidate(2, updateyear = efi.year);
    			$$invalidate(3, updateefiindex = efi.efiindex);
    			$$invalidate(4, updateefigovint = efi.efigovint);
    			$$invalidate(5, updateefipropright = efi.efipropright);
    			$$invalidate(6, updateefijudefct = efi.efijudefct);
    			$$invalidate(7, updateefitaxburden = efi.efitaxburden);
    			$$invalidate(8, updateefigovspend = efi.efigovspend);
    			$$invalidate(9, updateefisicalhealth = efi.efisicalhealth);
    			$$invalidate(10, updateefibusfreed = efi.efibusfreed);
    			$$invalidate(11, updateefilabfreed = efi.efilabfreed);
    			$$invalidate(12, updateefimonfreed = efi.efimonfreed);
    			$$invalidate(13, updateefitradefreed = efi.efitradefreed);
    			$$invalidate(14, updateefiinvfreed = efi.efiinvfreed);
    			$$invalidate(15, updateefifinfred = efi.efifinfred);
    			console.log("Received efi");
    		} else {
    			$$invalidate(16, msg = "Fallo en la carga del dato");
    			console.log("ERROR!!!");
    		}
    	}

    	async function updateEfi() {
    		console.log("Updating efi from " + JSON.stringify(params.country) + " " + JSON.stringify(params.year));

    		const res = await fetch("/api/v2/economic-freedom-indexes/" + params.country + "/" + params.year, {
    			method: "PUT",
    			body: JSON.stringify({
    				country: params.country,
    				year: parseInt(params.year),
    				efiindex: parseFloat(updateefiindex),
    				efigovint: parseFloat(updateefigovint),
    				efipropright: parseFloat(updateefipropright),
    				efijudefct: parseFloat(updateefijudefct),
    				efitaxburden: parseFloat(updateefitaxburden),
    				efigovspend: parseFloat(updateefigovspend),
    				efisicalhealth: parseFloat(updateefisicalhealth),
    				efibusfreed: parseFloat(updateefibusfreed),
    				efilabfreed: parseFloat(updateefilabfreed),
    				efimonfreed: parseFloat(updateefimonfreed),
    				efitradefreed: parseFloat(updateefitradefreed),
    				efiinvfreed: parseFloat(updateefiinvfreed),
    				efifinfred: parseFloat(updateefifinfred)
    			}),
    			headers: { "Content-Type": "application/json" }
    		}).then(function (res) {
    			if (res.ok) {
    				$$invalidate(16, msg = "EL DATO FUE ACTUALIZADO");

    				//location.href="/#/efis/";
    				getEfi();
    			} else {
    				res.status + ": " + res.statusText;
    			}
    		});
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<Editefi> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Editefi", $$slots, []);

    	function input0_input_handler() {
    		updateefiindex = this.value;
    		$$invalidate(3, updateefiindex);
    	}

    	function input1_input_handler() {
    		updateefigovint = this.value;
    		$$invalidate(4, updateefigovint);
    	}

    	function input2_input_handler() {
    		updateefipropright = this.value;
    		$$invalidate(5, updateefipropright);
    	}

    	function input3_input_handler() {
    		updateefijudefct = this.value;
    		$$invalidate(6, updateefijudefct);
    	}

    	function input4_input_handler() {
    		updateefitaxburden = this.value;
    		$$invalidate(7, updateefitaxburden);
    	}

    	function input5_input_handler() {
    		updateefigovspend = this.value;
    		$$invalidate(8, updateefigovspend);
    	}

    	function input6_input_handler() {
    		updateefisicalhealth = this.value;
    		$$invalidate(9, updateefisicalhealth);
    	}

    	function input7_input_handler() {
    		updateefibusfreed = this.value;
    		$$invalidate(10, updateefibusfreed);
    	}

    	function input8_input_handler() {
    		updateefilabfreed = this.value;
    		$$invalidate(11, updateefilabfreed);
    	}

    	function input9_input_handler() {
    		updateefimonfreed = this.value;
    		$$invalidate(12, updateefimonfreed);
    	}

    	function input10_input_handler() {
    		updateefitradefreed = this.value;
    		$$invalidate(13, updateefitradefreed);
    	}

    	function input11_input_handler() {
    		updateefiinvfreed = this.value;
    		$$invalidate(14, updateefiinvfreed);
    	}

    	function input12_input_handler() {
    		updateefifinfred = this.value;
    		$$invalidate(15, updateefifinfred);
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Table,
    		Button,
    		pop,
    		params,
    		efi,
    		updatecountry,
    		updateyear,
    		updateefiindex,
    		updateefigovint,
    		updateefipropright,
    		updateefijudefct,
    		updateefitaxburden,
    		updateefigovspend,
    		updateefisicalhealth,
    		updateefibusfreed,
    		updateefilabfreed,
    		updateefimonfreed,
    		updateefitradefreed,
    		updateefiinvfreed,
    		updateefifinfred,
    		msg,
    		getEfi,
    		updateEfi
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("efi" in $$props) $$invalidate(17, efi = $$props.efi);
    		if ("updatecountry" in $$props) $$invalidate(1, updatecountry = $$props.updatecountry);
    		if ("updateyear" in $$props) $$invalidate(2, updateyear = $$props.updateyear);
    		if ("updateefiindex" in $$props) $$invalidate(3, updateefiindex = $$props.updateefiindex);
    		if ("updateefigovint" in $$props) $$invalidate(4, updateefigovint = $$props.updateefigovint);
    		if ("updateefipropright" in $$props) $$invalidate(5, updateefipropright = $$props.updateefipropright);
    		if ("updateefijudefct" in $$props) $$invalidate(6, updateefijudefct = $$props.updateefijudefct);
    		if ("updateefitaxburden" in $$props) $$invalidate(7, updateefitaxburden = $$props.updateefitaxburden);
    		if ("updateefigovspend" in $$props) $$invalidate(8, updateefigovspend = $$props.updateefigovspend);
    		if ("updateefisicalhealth" in $$props) $$invalidate(9, updateefisicalhealth = $$props.updateefisicalhealth);
    		if ("updateefibusfreed" in $$props) $$invalidate(10, updateefibusfreed = $$props.updateefibusfreed);
    		if ("updateefilabfreed" in $$props) $$invalidate(11, updateefilabfreed = $$props.updateefilabfreed);
    		if ("updateefimonfreed" in $$props) $$invalidate(12, updateefimonfreed = $$props.updateefimonfreed);
    		if ("updateefitradefreed" in $$props) $$invalidate(13, updateefitradefreed = $$props.updateefitradefreed);
    		if ("updateefiinvfreed" in $$props) $$invalidate(14, updateefiinvfreed = $$props.updateefiinvfreed);
    		if ("updateefifinfred" in $$props) $$invalidate(15, updateefifinfred = $$props.updateefifinfred);
    		if ("msg" in $$props) $$invalidate(16, msg = $$props.msg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		params,
    		updatecountry,
    		updateyear,
    		updateefiindex,
    		updateefigovint,
    		updateefipropright,
    		updateefijudefct,
    		updateefitaxburden,
    		updateefigovspend,
    		updateefisicalhealth,
    		updateefibusfreed,
    		updateefilabfreed,
    		updateefimonfreed,
    		updateefitradefreed,
    		updateefiinvfreed,
    		updateefifinfred,
    		msg,
    		efi,
    		updateEfi,
    		getEfi,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input9_input_handler,
    		input10_input_handler,
    		input11_input_handler,
    		input12_input_handler
    	];
    }

    class Editefi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { params: 0 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editefi",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get params() {
    		throw new Error("<Editefi>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Editefi>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\crime\CrimeTable.svelte generated by Svelte v3.22.3 */

    const { console: console_1$5 } = globals;
    const file$8 = "src\\front\\crime\\CrimeTable.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	return child_ctx;
    }

    // (255:1) <Button outline color="danger" on:click={loadInitialData}>
    function create_default_slot_8$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("CARGAR DATOS INCIALES");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8$2.name,
    		type: "slot",
    		source: "(255:1) <Button outline color=\\\"danger\\\" on:click={loadInitialData}>",
    		ctx
    	});

    	return block;
    }

    // (256:1) {#if userMsg}
    function create_if_block$7(ctx) {
    	let h3;
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			p = element("p");
    			t = text(/*userMsg*/ ctx[0]);
    			add_location(p, file$8, 256, 5, 6967);
    			add_location(h3, file$8, 256, 1, 6963);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*userMsg*/ 1) set_data_dev(t, /*userMsg*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(256:1) {#if userMsg}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import {onMount}
    function create_catch_block$4(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$4.name,
    		type: "catch",
    		source: "(1:0) <script>      import {onMount}",
    		ctx
    	});

    	return block;
    }

    // (260:1) {:then crimes}
    function create_then_block$4(ctx) {
    	let current;

    	const table = new Table({
    			props: {
    				bordered: true,
    				style: "width: auto;",
    				$$slots: { default: [create_default_slot_4$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};

    			if (dirty[0] & /*crimes, newCrime*/ 10 | dirty[1] & /*$$scope*/ 256) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$4.name,
    		type: "then",
    		source: "(260:1) {:then crimes}",
    		ctx
    	});

    	return block;
    }

    // (283:8) <Button on:click={insertCrime} outline color="primary">
    function create_default_slot_7$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("INSERTAR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7$2.name,
    		type: "slot",
    		source: "(283:8) <Button on:click={insertCrime} outline color=\\\"primary\\\">",
    		ctx
    	});

    	return block;
    }

    // (295:8) <Button on:click={deleteCrime(crime.country,crime.year)} outline color="danger">
    function create_default_slot_6$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("BORRAR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$2.name,
    		type: "slot",
    		source: "(295:8) <Button on:click={deleteCrime(crime.country,crime.year)} outline color=\\\"danger\\\">",
    		ctx
    	});

    	return block;
    }

    // (285:3) {#each crimes as crime}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let a;
    	let t0_value = /*crime*/ ctx[36].country + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let td1;
    	let t2_value = /*crime*/ ctx[36].year + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*crime*/ ctx[36].cr_rate + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*crime*/ ctx[36].cr_saferate + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*crime*/ ctx[36].cr_homicrate + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = /*crime*/ ctx[36].cr_homicount + "";
    	let t10;
    	let t11;
    	let td6;
    	let t12_value = /*crime*/ ctx[36].cr_theftrate + "";
    	let t12;
    	let t13;
    	let td7;
    	let t14_value = /*crime*/ ctx[36].cr_theftcount + "";
    	let t14;
    	let t15;
    	let td8;
    	let t16;
    	let current;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_6$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*deleteCrime*/ ctx[6](/*crime*/ ctx[36].country, /*crime*/ ctx[36].year))) /*deleteCrime*/ ctx[6](/*crime*/ ctx[36].country, /*crime*/ ctx[36].year).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td6 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td7 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			td8 = element("td");
    			create_component(button.$$.fragment);
    			t16 = space();
    			attr_dev(a, "href", a_href_value = "/#/crimes/" + /*crime*/ ctx[36].country + "/" + /*crime*/ ctx[36].year);
    			add_location(a, file$8, 286, 8, 8198);
    			add_location(td0, file$8, 286, 4, 8194);
    			add_location(td1, file$8, 287, 4, 8277);
    			add_location(td2, file$8, 288, 4, 8304);
    			add_location(td3, file$8, 289, 4, 8334);
    			add_location(td4, file$8, 290, 4, 8368);
    			add_location(td5, file$8, 291, 4, 8403);
    			add_location(td6, file$8, 292, 4, 8438);
    			add_location(td7, file$8, 293, 4, 8473);
    			add_location(td8, file$8, 294, 4, 8509);
    			add_location(tr, file$8, 285, 3, 8184);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, a);
    			append_dev(a, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td6);
    			append_dev(td6, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td7);
    			append_dev(td7, t14);
    			append_dev(tr, t15);
    			append_dev(tr, td8);
    			mount_component(button, td8, null);
    			append_dev(tr, t16);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*crimes*/ 8) && t0_value !== (t0_value = /*crime*/ ctx[36].country + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*crimes*/ 8 && a_href_value !== (a_href_value = "/#/crimes/" + /*crime*/ ctx[36].country + "/" + /*crime*/ ctx[36].year)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if ((!current || dirty[0] & /*crimes*/ 8) && t2_value !== (t2_value = /*crime*/ ctx[36].year + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*crimes*/ 8) && t4_value !== (t4_value = /*crime*/ ctx[36].cr_rate + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[0] & /*crimes*/ 8) && t6_value !== (t6_value = /*crime*/ ctx[36].cr_saferate + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty[0] & /*crimes*/ 8) && t8_value !== (t8_value = /*crime*/ ctx[36].cr_homicrate + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty[0] & /*crimes*/ 8) && t10_value !== (t10_value = /*crime*/ ctx[36].cr_homicount + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty[0] & /*crimes*/ 8) && t12_value !== (t12_value = /*crime*/ ctx[36].cr_theftrate + "")) set_data_dev(t12, t12_value);
    			if ((!current || dirty[0] & /*crimes*/ 8) && t14_value !== (t14_value = /*crime*/ ctx[36].cr_theftcount + "")) set_data_dev(t14, t14_value);
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(285:3) {#each crimes as crime}",
    		ctx
    	});

    	return block;
    }

    // (299:2) <Button outline color="danger" on:click={deleteCrimes}>
    function create_default_slot_5$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("BORRAR TODO");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$2.name,
    		type: "slot",
    		source: "(299:2) <Button outline color=\\\"danger\\\" on:click={deleteCrimes}>",
    		ctx
    	});

    	return block;
    }

    // (261:4) <Table bordered style="width: auto;">
    function create_default_slot_4$2(ctx) {
    	let thead;
    	let td0;
    	let t1;
    	let td1;
    	let t3;
    	let td2;
    	let t5;
    	let td3;
    	let t7;
    	let td4;
    	let t9;
    	let td5;
    	let t11;
    	let td6;
    	let t13;
    	let td7;
    	let t15;
    	let td8;
    	let t17;
    	let tbody;
    	let tr;
    	let td9;
    	let input0;
    	let t18;
    	let td10;
    	let input1;
    	let t19;
    	let td11;
    	let input2;
    	let t20;
    	let td12;
    	let input3;
    	let t21;
    	let td13;
    	let input4;
    	let t22;
    	let td14;
    	let input5;
    	let t23;
    	let td15;
    	let input6;
    	let t24;
    	let td16;
    	let input7;
    	let t25;
    	let td17;
    	let t26;
    	let t27;
    	let current;
    	let dispose;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_7$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*insertCrime*/ ctx[5]);
    	let each_value = /*crimes*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_5$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*deleteCrimes*/ ctx[7]);

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			td0 = element("td");
    			td0.textContent = "Country";
    			t1 = space();
    			td1 = element("td");
    			td1.textContent = "Year";
    			t3 = space();
    			td2 = element("td");
    			td2.textContent = "Crime Rate";
    			t5 = space();
    			td3 = element("td");
    			td3.textContent = "Safe Rate";
    			t7 = space();
    			td4 = element("td");
    			td4.textContent = "Homicide Rate";
    			t9 = space();
    			td5 = element("td");
    			td5.textContent = "Homicide Count";
    			t11 = space();
    			td6 = element("td");
    			td6.textContent = "Theft Rate";
    			t13 = space();
    			td7 = element("td");
    			td7.textContent = "Theft Count";
    			t15 = space();
    			td8 = element("td");
    			td8.textContent = "Opciones";
    			t17 = space();
    			tbody = element("tbody");
    			tr = element("tr");
    			td9 = element("td");
    			input0 = element("input");
    			t18 = space();
    			td10 = element("td");
    			input1 = element("input");
    			t19 = space();
    			td11 = element("td");
    			input2 = element("input");
    			t20 = space();
    			td12 = element("td");
    			input3 = element("input");
    			t21 = space();
    			td13 = element("td");
    			input4 = element("input");
    			t22 = space();
    			td14 = element("td");
    			input5 = element("input");
    			t23 = space();
    			td15 = element("td");
    			input6 = element("input");
    			t24 = space();
    			td16 = element("td");
    			input7 = element("input");
    			t25 = space();
    			td17 = element("td");
    			create_component(button0.$$.fragment);
    			t26 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t27 = space();
    			create_component(button1.$$.fragment);
    			add_location(td0, file$8, 262, 12, 7106);
    			add_location(td1, file$8, 263, 12, 7136);
    			add_location(td2, file$8, 264, 12, 7163);
    			add_location(td3, file$8, 265, 12, 7196);
    			add_location(td4, file$8, 266, 12, 7228);
    			add_location(td5, file$8, 267, 12, 7264);
    			add_location(td6, file$8, 268, 12, 7301);
    			add_location(td7, file$8, 269, 12, 7334);
    			add_location(td8, file$8, 270, 3, 7359);
    			add_location(thead, file$8, 261, 8, 7085);
    			set_style(input0, "width", "100px");
    			add_location(input0, file$8, 274, 8, 7430);
    			add_location(td9, file$8, 274, 4, 7426);
    			set_style(input1, "width", "50px");
    			add_location(input1, file$8, 275, 8, 7508);
    			add_location(td10, file$8, 275, 4, 7504);
    			set_style(input2, "width", "50px");
    			add_location(input2, file$8, 276, 8, 7582);
    			add_location(td11, file$8, 276, 4, 7578);
    			set_style(input3, "width", "100px");
    			add_location(input3, file$8, 277, 8, 7659);
    			add_location(td12, file$8, 277, 4, 7655);
    			set_style(input4, "width", "100px");
    			add_location(input4, file$8, 278, 8, 7739);
    			add_location(td13, file$8, 278, 4, 7735);
    			set_style(input5, "width", "100px");
    			add_location(input5, file$8, 279, 8, 7820);
    			add_location(td14, file$8, 279, 4, 7816);
    			set_style(input6, "width", "100px");
    			add_location(input6, file$8, 280, 8, 7901);
    			add_location(td15, file$8, 280, 4, 7897);
    			set_style(input7, "width", "100px");
    			add_location(input7, file$8, 281, 8, 7982);
    			add_location(td16, file$8, 281, 4, 7978);
    			add_location(td17, file$8, 282, 4, 8060);
    			add_location(tr, file$8, 273, 3, 7416);
    			add_location(tbody, file$8, 272, 8, 7404);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, td0);
    			append_dev(thead, t1);
    			append_dev(thead, td1);
    			append_dev(thead, t3);
    			append_dev(thead, td2);
    			append_dev(thead, t5);
    			append_dev(thead, td3);
    			append_dev(thead, t7);
    			append_dev(thead, td4);
    			append_dev(thead, t9);
    			append_dev(thead, td5);
    			append_dev(thead, t11);
    			append_dev(thead, td6);
    			append_dev(thead, t13);
    			append_dev(thead, td7);
    			append_dev(thead, t15);
    			append_dev(thead, td8);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr);
    			append_dev(tr, td9);
    			append_dev(td9, input0);
    			set_input_value(input0, /*newCrime*/ ctx[1].country);
    			append_dev(tr, t18);
    			append_dev(tr, td10);
    			append_dev(td10, input1);
    			set_input_value(input1, /*newCrime*/ ctx[1].year);
    			append_dev(tr, t19);
    			append_dev(tr, td11);
    			append_dev(td11, input2);
    			set_input_value(input2, /*newCrime*/ ctx[1].cr_rate);
    			append_dev(tr, t20);
    			append_dev(tr, td12);
    			append_dev(td12, input3);
    			set_input_value(input3, /*newCrime*/ ctx[1].cr_saferate);
    			append_dev(tr, t21);
    			append_dev(tr, td13);
    			append_dev(td13, input4);
    			set_input_value(input4, /*newCrime*/ ctx[1].cr_homicrate);
    			append_dev(tr, t22);
    			append_dev(tr, td14);
    			append_dev(td14, input5);
    			set_input_value(input5, /*newCrime*/ ctx[1].cr_homicount);
    			append_dev(tr, t23);
    			append_dev(tr, td15);
    			append_dev(td15, input6);
    			set_input_value(input6, /*newCrime*/ ctx[1].cr_theftrate);
    			append_dev(tr, t24);
    			append_dev(tr, td16);
    			append_dev(td16, input7);
    			set_input_value(input7, /*newCrime*/ ctx[1].cr_theftcount);
    			append_dev(tr, t25);
    			append_dev(tr, td17);
    			mount_component(button0, td17, null);
    			append_dev(tbody, t26);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			insert_dev(target, t27, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[20]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[21]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[22]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[23]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[24]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[25]),
    				listen_dev(input6, "input", /*input6_input_handler*/ ctx[26]),
    				listen_dev(input7, "input", /*input7_input_handler*/ ctx[27])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newCrime*/ 2 && input0.value !== /*newCrime*/ ctx[1].country) {
    				set_input_value(input0, /*newCrime*/ ctx[1].country);
    			}

    			if (dirty[0] & /*newCrime*/ 2 && input1.value !== /*newCrime*/ ctx[1].year) {
    				set_input_value(input1, /*newCrime*/ ctx[1].year);
    			}

    			if (dirty[0] & /*newCrime*/ 2 && input2.value !== /*newCrime*/ ctx[1].cr_rate) {
    				set_input_value(input2, /*newCrime*/ ctx[1].cr_rate);
    			}

    			if (dirty[0] & /*newCrime*/ 2 && input3.value !== /*newCrime*/ ctx[1].cr_saferate) {
    				set_input_value(input3, /*newCrime*/ ctx[1].cr_saferate);
    			}

    			if (dirty[0] & /*newCrime*/ 2 && input4.value !== /*newCrime*/ ctx[1].cr_homicrate) {
    				set_input_value(input4, /*newCrime*/ ctx[1].cr_homicrate);
    			}

    			if (dirty[0] & /*newCrime*/ 2 && input5.value !== /*newCrime*/ ctx[1].cr_homicount) {
    				set_input_value(input5, /*newCrime*/ ctx[1].cr_homicount);
    			}

    			if (dirty[0] & /*newCrime*/ 2 && input6.value !== /*newCrime*/ ctx[1].cr_theftrate) {
    				set_input_value(input6, /*newCrime*/ ctx[1].cr_theftrate);
    			}

    			if (dirty[0] & /*newCrime*/ 2 && input7.value !== /*newCrime*/ ctx[1].cr_theftcount) {
    				set_input_value(input7, /*newCrime*/ ctx[1].cr_theftcount);
    			}

    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);

    			if (dirty[0] & /*deleteCrime, crimes*/ 72) {
    				each_value = /*crimes*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(tbody);
    			destroy_component(button0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t27);
    			destroy_component(button1, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$2.name,
    		type: "slot",
    		source: "(261:4) <Table bordered style=\\\"width: auto;\\\">",
    		ctx
    	});

    	return block;
    }

    // (259:16) ;   {:then crimes}
    function create_pending_block$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(";");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$4.name,
    		type: "pending",
    		source: "(259:16) ;   {:then crimes}",
    		ctx
    	});

    	return block;
    }

    // (329:2) <Button outline color="secondary" on:click={searchCrimes}>
    function create_default_slot_3$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("BUSCAR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(329:2) <Button outline color=\\\"secondary\\\" on:click={searchCrimes}>",
    		ctx
    	});

    	return block;
    }

    // (303:1) <Table bordered style="width: auto;">
    function create_default_slot_2$4(ctx) {
    	let thead;
    	let tr0;
    	let td0;
    	let t1;
    	let td1;
    	let t3;
    	let td2;
    	let t5;
    	let td3;
    	let t7;
    	let td4;
    	let t9;
    	let td5;
    	let t11;
    	let td6;
    	let t13;
    	let td7;
    	let t15;
    	let tbody;
    	let tr1;
    	let td8;
    	let input0;
    	let t16;
    	let td9;
    	let input1;
    	let t17;
    	let td10;
    	let input2;
    	let t18;
    	let td11;
    	let input3;
    	let t19;
    	let td12;
    	let input4;
    	let t20;
    	let td13;
    	let input5;
    	let t21;
    	let td14;
    	let input6;
    	let t22;
    	let td15;
    	let input7;
    	let t23;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*searchCrimes*/ ctx[8]);

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Country";
    			t1 = space();
    			td1 = element("td");
    			td1.textContent = "Year";
    			t3 = space();
    			td2 = element("td");
    			td2.textContent = "Crime Rate";
    			t5 = space();
    			td3 = element("td");
    			td3.textContent = "Safe Rate";
    			t7 = space();
    			td4 = element("td");
    			td4.textContent = "Homicide Rate";
    			t9 = space();
    			td5 = element("td");
    			td5.textContent = "Homicide Count";
    			t11 = space();
    			td6 = element("td");
    			td6.textContent = "Theft Rate";
    			t13 = space();
    			td7 = element("td");
    			td7.textContent = "Theft Count";
    			t15 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td8 = element("td");
    			input0 = element("input");
    			t16 = space();
    			td9 = element("td");
    			input1 = element("input");
    			t17 = space();
    			td10 = element("td");
    			input2 = element("input");
    			t18 = space();
    			td11 = element("td");
    			input3 = element("input");
    			t19 = space();
    			td12 = element("td");
    			input4 = element("input");
    			t20 = space();
    			td13 = element("td");
    			input5 = element("input");
    			t21 = space();
    			td14 = element("td");
    			input6 = element("input");
    			t22 = space();
    			td15 = element("td");
    			input7 = element("input");
    			t23 = space();
    			create_component(button.$$.fragment);
    			add_location(td0, file$8, 305, 3, 8821);
    			add_location(td1, file$8, 306, 12, 8851);
    			add_location(td2, file$8, 307, 12, 8878);
    			add_location(td3, file$8, 308, 12, 8911);
    			add_location(td4, file$8, 309, 12, 8943);
    			add_location(td5, file$8, 310, 12, 8979);
    			add_location(td6, file$8, 311, 12, 9016);
    			add_location(td7, file$8, 312, 12, 9049);
    			add_location(tr0, file$8, 304, 3, 8812);
    			add_location(thead, file$8, 303, 2, 8800);
    			set_style(input0, "width", "100px");
    			add_location(input0, file$8, 317, 8, 9121);
    			add_location(td8, file$8, 317, 4, 9117);
    			set_style(input1, "width", "50px");
    			add_location(input1, file$8, 318, 8, 9201);
    			add_location(td9, file$8, 318, 4, 9197);
    			set_style(input2, "width", "100px");
    			add_location(input2, file$8, 319, 8, 9277);
    			add_location(td10, file$8, 319, 4, 9273);
    			set_style(input3, "width", "100px");
    			add_location(input3, file$8, 320, 8, 9355);
    			add_location(td11, file$8, 320, 4, 9351);
    			set_style(input4, "width", "100px");
    			add_location(input4, file$8, 321, 8, 9437);
    			add_location(td12, file$8, 321, 4, 9433);
    			set_style(input5, "width", "100px");
    			add_location(input5, file$8, 322, 8, 9520);
    			add_location(td13, file$8, 322, 4, 9516);
    			set_style(input6, "width", "100px");
    			add_location(input6, file$8, 323, 8, 9603);
    			add_location(td14, file$8, 323, 4, 9599);
    			set_style(input7, "width", "100px");
    			add_location(input7, file$8, 324, 8, 9686);
    			add_location(td15, file$8, 324, 4, 9682);
    			add_location(tr1, file$8, 316, 3, 9107);
    			add_location(tbody, file$8, 315, 2, 9095);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, td0);
    			append_dev(tr0, t1);
    			append_dev(tr0, td1);
    			append_dev(tr0, t3);
    			append_dev(tr0, td2);
    			append_dev(tr0, t5);
    			append_dev(tr0, td3);
    			append_dev(tr0, t7);
    			append_dev(tr0, td4);
    			append_dev(tr0, t9);
    			append_dev(tr0, td5);
    			append_dev(tr0, t11);
    			append_dev(tr0, td6);
    			append_dev(tr0, t13);
    			append_dev(tr0, td7);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td8);
    			append_dev(td8, input0);
    			set_input_value(input0, /*queryCrime*/ ctx[2].country);
    			append_dev(tr1, t16);
    			append_dev(tr1, td9);
    			append_dev(td9, input1);
    			set_input_value(input1, /*queryCrime*/ ctx[2].year);
    			append_dev(tr1, t17);
    			append_dev(tr1, td10);
    			append_dev(td10, input2);
    			set_input_value(input2, /*queryCrime*/ ctx[2].cr_rate);
    			append_dev(tr1, t18);
    			append_dev(tr1, td11);
    			append_dev(td11, input3);
    			set_input_value(input3, /*queryCrime*/ ctx[2].cr_saferate);
    			append_dev(tr1, t19);
    			append_dev(tr1, td12);
    			append_dev(td12, input4);
    			set_input_value(input4, /*queryCrime*/ ctx[2].cr_homicrate);
    			append_dev(tr1, t20);
    			append_dev(tr1, td13);
    			append_dev(td13, input5);
    			set_input_value(input5, /*queryCrime*/ ctx[2].cr_homicount);
    			append_dev(tr1, t21);
    			append_dev(tr1, td14);
    			append_dev(td14, input6);
    			set_input_value(input6, /*queryCrime*/ ctx[2].cr_theftrate);
    			append_dev(tr1, t22);
    			append_dev(tr1, td15);
    			append_dev(td15, input7);
    			set_input_value(input7, /*queryCrime*/ ctx[2].cr_theftcount);
    			insert_dev(target, t23, anchor);
    			mount_component(button, target, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[28]),
    				listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[29]),
    				listen_dev(input2, "input", /*input2_input_handler_1*/ ctx[30]),
    				listen_dev(input3, "input", /*input3_input_handler_1*/ ctx[31]),
    				listen_dev(input4, "input", /*input4_input_handler_1*/ ctx[32]),
    				listen_dev(input5, "input", /*input5_input_handler_1*/ ctx[33]),
    				listen_dev(input6, "input", /*input6_input_handler_1*/ ctx[34]),
    				listen_dev(input7, "input", /*input7_input_handler_1*/ ctx[35])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*queryCrime*/ 4 && input0.value !== /*queryCrime*/ ctx[2].country) {
    				set_input_value(input0, /*queryCrime*/ ctx[2].country);
    			}

    			if (dirty[0] & /*queryCrime*/ 4 && input1.value !== /*queryCrime*/ ctx[2].year) {
    				set_input_value(input1, /*queryCrime*/ ctx[2].year);
    			}

    			if (dirty[0] & /*queryCrime*/ 4 && input2.value !== /*queryCrime*/ ctx[2].cr_rate) {
    				set_input_value(input2, /*queryCrime*/ ctx[2].cr_rate);
    			}

    			if (dirty[0] & /*queryCrime*/ 4 && input3.value !== /*queryCrime*/ ctx[2].cr_saferate) {
    				set_input_value(input3, /*queryCrime*/ ctx[2].cr_saferate);
    			}

    			if (dirty[0] & /*queryCrime*/ 4 && input4.value !== /*queryCrime*/ ctx[2].cr_homicrate) {
    				set_input_value(input4, /*queryCrime*/ ctx[2].cr_homicrate);
    			}

    			if (dirty[0] & /*queryCrime*/ 4 && input5.value !== /*queryCrime*/ ctx[2].cr_homicount) {
    				set_input_value(input5, /*queryCrime*/ ctx[2].cr_homicount);
    			}

    			if (dirty[0] & /*queryCrime*/ 4 && input6.value !== /*queryCrime*/ ctx[2].cr_theftrate) {
    				set_input_value(input6, /*queryCrime*/ ctx[2].cr_theftrate);
    			}

    			if (dirty[0] & /*queryCrime*/ 4 && input7.value !== /*queryCrime*/ ctx[2].cr_theftcount) {
    				set_input_value(input7, /*queryCrime*/ ctx[2].cr_theftcount);
    			}

    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(tbody);
    			if (detaching) detach_dev(t23);
    			destroy_component(button, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$4.name,
    		type: "slot",
    		source: "(303:1) <Table bordered style=\\\"width: auto;\\\">",
    		ctx
    	});

    	return block;
    }

    // (331:1) <Button outline color="secondary" on:click={beforeOffset}>
    function create_default_slot_1$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("ANTERIOR");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(331:1) <Button outline color=\\\"secondary\\\" on:click={beforeOffset}>",
    		ctx
    	});

    	return block;
    }

    // (332:1) <Button outline color="secondary" on:click={nextOffset}>
    function create_default_slot$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SIGUIENTE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(332:1) <Button outline color=\\\"secondary\\\" on:click={nextOffset}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let t2;
    	let t3;
    	let promise;
    	let t4;
    	let t5;
    	let t6;
    	let current;

    	const button0 = new Button({
    			props: {
    				outline: true,
    				color: "danger",
    				$$slots: { default: [create_default_slot_8$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*loadInitialData*/ ctx[4]);
    	let if_block = /*userMsg*/ ctx[0] && create_if_block$7(ctx);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$4,
    		then: create_then_block$4,
    		catch: create_catch_block$4,
    		value: 3,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*crimes*/ ctx[3], info);

    	const table = new Table({
    			props: {
    				bordered: true,
    				style: "width: auto;",
    				$$slots: { default: [create_default_slot_2$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*beforeOffset*/ ctx[9]);

    	const button2 = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", /*nextOffset*/ ctx[10]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "GUI Crimes";
    			t1 = space();
    			create_component(button0.$$.fragment);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			info.block.c();
    			t4 = space();
    			create_component(table.$$.fragment);
    			t5 = space();
    			create_component(button1.$$.fragment);
    			t6 = space();
    			create_component(button2.$$.fragment);
    			add_location(h2, file$8, 253, 1, 6833);
    			add_location(main, file$8, 252, 0, 6824);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);
    			mount_component(button0, main, null);
    			append_dev(main, t2);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t3);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t4;
    			append_dev(main, t4);
    			mount_component(table, main, null);
    			append_dev(main, t5);
    			mount_component(button1, main, null);
    			append_dev(main, t6);
    			mount_component(button2, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button0_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);

    			if (/*userMsg*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(main, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			info.ctx = ctx;

    			if (dirty[0] & /*crimes*/ 8 && promise !== (promise = /*crimes*/ ctx[3]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[3] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			const table_changes = {};

    			if (dirty[0] & /*queryCrime*/ 4 | dirty[1] & /*$$scope*/ 256) {
    				table_changes.$$scope = { dirty, ctx };
    			}

    			table.$set(table_changes);
    			const button1_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty[1] & /*$$scope*/ 256) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(info.block);
    			transition_in(table.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(table.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(button0);
    			if (if_block) if_block.d();
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(table);
    			destroy_component(button1);
    			destroy_component(button2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let msg;
    	let busquedaEsp = false;
    	let crimenes;
    	let offset = 0;
    	let limit = 10;
    	let numTotal = 0;
    	let numFiltered;
    	let userMsg = "";
    	let crimes = [];

    	let newCrime = {
    		country: "",
    		year: 0,
    		cr_rate: 0,
    		cr_saferate: 0,
    		cr_homicrate: 0,
    		cr_homicount: 0,
    		cr_theftrate: 0,
    		cr_theftcount: 0
    	};

    	let queryCrime = {
    		country: "",
    		year: "",
    		cr_rate: "",
    		cr_saferate: "",
    		cr_homicrate: "",
    		cr_homicount: "",
    		cr_theftrate: "",
    		cr_theftcount: ""
    	};

    	onMount(getCrimes);

    	async function loadInitialData() {
    		console.log("Cargando crimenes iniciales");
    		const res = await fetch("/api/v2/crime-rate-stats/loadInitialData");

    		if (res.ok) {
    			console.log("Datos iniciales cargados");
    			$$invalidate(0, userMsg = "Estos son los datos iniciales");
    			getCrimes();
    		} else {
    			$$invalidate(3, crimes = []);

    			if (userMsg != "Todos los datos han sido borrados.") {
    				$$invalidate(0, userMsg = "No se han encontrado datos. " + res.statusText);
    			}

    			console.log("Base de datos vacía");
    		}
    	}

    	async function getCrimes() {
    		var query = "";

    		//numTotal = await getNumTotal(query);
    		console.log("Buscando..");

    		query = query + "?limit=" + limit + "&offset=" + offset;
    		const res = await fetch("/api/v2/crime-rate-stats" + query);

    		if (res.ok) {
    			console.log("OK!");
    			const json = await res.json();
    			$$invalidate(3, crimes = json);
    			console.log("Received " + crimes.length + " rpcs.");
    			numTotal = crimes.length;

    			if (userMsg == "El dato fue insertado correctamente." || userMsg == "El dato ha sido borrado.") {
    				$$invalidate(0, userMsg = userMsg + "\nMostrando " + crimes.length + " de " + numTotal + " datos. Página:" + (offset / limit + 1));
    			} else {
    				$$invalidate(0, userMsg = "Mostrando " + crimes.length + " de " + numTotal + " datos. Página:" + (offset / limit + 1));
    			}
    		} else {
    			$$invalidate(3, crimes = []);

    			if (userMsg != "Todos los datos han sido borrados.") {
    				$$invalidate(0, userMsg = "No se han encontrado datos.");
    			}

    			console.log("Datasabe empty");
    		}
    	}

    	async function insertCrime() {
    		if (newCrime.country != "" && !isNaN(parseInt(newCrime.year))) {
    			crimes.forEach(x => {
    				if (x.country == newCrime.country && x.year == newCrime.year) {
    					$$invalidate(0, userMsg = "El dato de ese año y país ya existe.");
    				}
    			});

    			$$invalidate(1, newCrime);
    			$$invalidate(1, newCrime.year = parseInt(newCrime.year), newCrime);
    			$$invalidate(1, newCrime.cr_rate = parseFloat(newCrime.cr_rate), newCrime);
    			$$invalidate(1, newCrime.cr_saferate = parseFloat(newCrime.cr_saferate), newCrime);
    			$$invalidate(1, newCrime.cr_homicrate = parseFloat(newCrime.cr_homicrate), newCrime);
    			$$invalidate(1, newCrime.cr_homicount = parseInt(newCrime.cr_homicount), newCrime);
    			$$invalidate(1, newCrime.cr_theftrate = parseFloat(newCrime.cr_theftrate), newCrime);
    			$$invalidate(1, newCrime.cr_theftcount = parseInt(newCrime.cr_theftcount), newCrime);

    			if (userMsg != "El dato de ese año y país ya existe.") {
    				console.log("Inserting rpc... " + JSON.stringify(newCrime));

    				const res = await fetch("/api/v2/crime-rate-stats", {
    					method: "POST",
    					body: JSON.stringify(newCrime),
    					headers: { "Content-Type": "application/json" }
    				}).then(function (res) {
    					$$invalidate(0, userMsg = "El dato fue insertado correctamente.");
    					getCrimes();
    				});
    			}
    		} else {
    			$$invalidate(0, userMsg = "El dato insertado no tiene nombre/año válido/s .");
    			console.log("Inserted crime has no valid name or valid year.");
    			getCrimes();
    		}
    	}

    	async function deleteCrime(country, year) {
    		console.log("Borrando crimen... ");

    		const res = await fetch("/api/v2/crime-rate-stats/" + country + "/" + year, { method: "DELETE" }).then(function (res) {
    			getCrimes();
    			$$invalidate(0, userMsg = "El dato ha sido borrado.");
    		});
    	}

    	async function deleteCrimes() {
    		console.log("Borrando crimenes..");

    		const res = await fetch("/api/v2/crime-rate-stats", { method: "DELETE" }).then(function (res) {
    			$$invalidate(0, userMsg = "Todos los datos han sido borrados.");
    			getCrimes();
    		});
    	}

    	async function searchCrimes() {
    		console.log("Buscando...");
    		var query = "?";

    		if (queryCrime.country != "") {
    			if (query == "?") {
    				query = query + "country=" + queryCrime.country;
    			} else {
    				query = query + "&country=" + queryCrime.country;
    			}
    		}

    		if (queryCrime.year != "") {
    			if (query == "?") {
    				query = query + "year=" + queryCrime.year;
    			} else {
    				query = query + "&year=" + queryCrime.year;
    			}
    		}

    		if (queryCrime.cr_rate != "") {
    			if (query == "?") {
    				query = query + "cr_rate=" + queryCrime.cr_rate;
    			} else {
    				query = query + "&cr_rate=" + queryCrime.cr_rate;
    			}
    		}

    		if (queryCrime.cr_saferate != "") {
    			if (query == "?") {
    				query = query + "cr_saferate=" + queryCrime.cr_saferate;
    			} else {
    				query = query + "&cr_saferate=" + queryCrime.cr_saferate;
    			}
    		}

    		if (queryCrime.cr_homicrate != "") {
    			if (query == "?") {
    				query = query + "cr_homicrate=" + queryCrime.cr_homicrate;
    			} else {
    				query = query + "&cr_homicrate=" + queryCrime.cr_homicrate;
    			}
    		}

    		if (queryCrime.cr_homicount != "") {
    			if (query == "?") {
    				query = query + "cr_homicount=" + queryCrime.cr_homicount;
    			} else {
    				query = query + "&cr_homicount=" + queryCrime.cr_homicount;
    			}
    		}

    		if (queryCrime.cr_theftrate != "") {
    			if (query == "?") {
    				query = query + "cr_theftrate=" + queryCrime.cr_theftrate;
    			} else {
    				query = query + "&cr_theftrate=" + queryCrime.cr_theftrate;
    			}
    		}

    		if (queryCrime.cr_theftcount != "") {
    			if (query == "?") {
    				query = query + "cr_theftcount=" + queryCrime.cr_theftcount;
    			} else {
    				query = query + "&cr_theftcount=" + queryCrime.cr_theftcount;
    			}
    		}

    		query = query + "&limit=" + limit + "&offset=" + offset;
    		const res = await fetch("/api/v2/crime-rate-stats" + query);
    		console.log("Sending this.." + JSON.stringify(queryCrime));

    		if (res.ok) {
    			console.log("OK!");
    			const json = await res.json();
    			crimes2 = json;
    			console.log("Received " + crimes2 + " crimes, offset = " + offset + ".");
    			numFiltered = crimes2.length;
    			$$invalidate(0, userMsg = "Mostrando " + numFiltered + " de " + numTotal + " datos.");
    		} else {
    			$$invalidate(3, crimes = []);
    			$$invalidate(0, userMsg = "No se han encontrado datos.");
    			console.log("Not found");
    		}
    	}

    	async function beforeOffset() {
    		if (offset >= 2) offset = offset - limit;
    		searchCrimes();
    	}

    	async function nextOffset() {
    		if (offset + limit < numTotal) offset = offset + limit;
    		searchCrimes();
    	}

    	async function getNumTotal(query) {
    		const res = await fetch("/api/v2/crime-rate-stats" + query);

    		if (res.ok) {
    			const json = await res.json();
    			crimenes = json;
    			return parseInt(crimenes.length);
    		} else {
    			if (userMsg != "Todos los datos han sido borrados.") {
    				$$invalidate(0, userMsg = "No se han encontrado datos.");
    			}

    			
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<CrimeTable> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CrimeTable", $$slots, []);

    	function input0_input_handler() {
    		newCrime.country = this.value;
    		$$invalidate(1, newCrime);
    	}

    	function input1_input_handler() {
    		newCrime.year = this.value;
    		$$invalidate(1, newCrime);
    	}

    	function input2_input_handler() {
    		newCrime.cr_rate = this.value;
    		$$invalidate(1, newCrime);
    	}

    	function input3_input_handler() {
    		newCrime.cr_saferate = this.value;
    		$$invalidate(1, newCrime);
    	}

    	function input4_input_handler() {
    		newCrime.cr_homicrate = this.value;
    		$$invalidate(1, newCrime);
    	}

    	function input5_input_handler() {
    		newCrime.cr_homicount = this.value;
    		$$invalidate(1, newCrime);
    	}

    	function input6_input_handler() {
    		newCrime.cr_theftrate = this.value;
    		$$invalidate(1, newCrime);
    	}

    	function input7_input_handler() {
    		newCrime.cr_theftcount = this.value;
    		$$invalidate(1, newCrime);
    	}

    	function input0_input_handler_1() {
    		queryCrime.country = this.value;
    		$$invalidate(2, queryCrime);
    	}

    	function input1_input_handler_1() {
    		queryCrime.year = this.value;
    		$$invalidate(2, queryCrime);
    	}

    	function input2_input_handler_1() {
    		queryCrime.cr_rate = this.value;
    		$$invalidate(2, queryCrime);
    	}

    	function input3_input_handler_1() {
    		queryCrime.cr_saferate = this.value;
    		$$invalidate(2, queryCrime);
    	}

    	function input4_input_handler_1() {
    		queryCrime.cr_homicrate = this.value;
    		$$invalidate(2, queryCrime);
    	}

    	function input5_input_handler_1() {
    		queryCrime.cr_homicount = this.value;
    		$$invalidate(2, queryCrime);
    	}

    	function input6_input_handler_1() {
    		queryCrime.cr_theftrate = this.value;
    		$$invalidate(2, queryCrime);
    	}

    	function input7_input_handler_1() {
    		queryCrime.cr_theftcount = this.value;
    		$$invalidate(2, queryCrime);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Table,
    		Button,
    		msg,
    		busquedaEsp,
    		crimenes,
    		offset,
    		limit,
    		numTotal,
    		numFiltered,
    		userMsg,
    		crimes,
    		newCrime,
    		queryCrime,
    		loadInitialData,
    		getCrimes,
    		insertCrime,
    		deleteCrime,
    		deleteCrimes,
    		searchCrimes,
    		beforeOffset,
    		nextOffset,
    		getNumTotal
    	});

    	$$self.$inject_state = $$props => {
    		if ("msg" in $$props) msg = $$props.msg;
    		if ("busquedaEsp" in $$props) busquedaEsp = $$props.busquedaEsp;
    		if ("crimenes" in $$props) crimenes = $$props.crimenes;
    		if ("offset" in $$props) offset = $$props.offset;
    		if ("limit" in $$props) limit = $$props.limit;
    		if ("numTotal" in $$props) numTotal = $$props.numTotal;
    		if ("numFiltered" in $$props) numFiltered = $$props.numFiltered;
    		if ("userMsg" in $$props) $$invalidate(0, userMsg = $$props.userMsg);
    		if ("crimes" in $$props) $$invalidate(3, crimes = $$props.crimes);
    		if ("newCrime" in $$props) $$invalidate(1, newCrime = $$props.newCrime);
    		if ("queryCrime" in $$props) $$invalidate(2, queryCrime = $$props.queryCrime);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		userMsg,
    		newCrime,
    		queryCrime,
    		crimes,
    		loadInitialData,
    		insertCrime,
    		deleteCrime,
    		deleteCrimes,
    		searchCrimes,
    		beforeOffset,
    		nextOffset,
    		crimenes,
    		offset,
    		numTotal,
    		numFiltered,
    		msg,
    		busquedaEsp,
    		limit,
    		getCrimes,
    		getNumTotal,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		input2_input_handler_1,
    		input3_input_handler_1,
    		input4_input_handler_1,
    		input5_input_handler_1,
    		input6_input_handler_1,
    		input7_input_handler_1
    	];
    }

    class CrimeTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CrimeTable",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\front\crime\EditCrime.svelte generated by Svelte v3.22.3 */

    const { console: console_1$6 } = globals;
    const file$9 = "src\\front\\crime\\EditCrime.svelte";

    // (69:77) {#if userMsg}
    function create_if_block$8(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*userMsg*/ ctx[9]);
    			set_style(p, "color", "orange");
    			add_location(p, file$9, 68, 90, 2173);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*userMsg*/ 512) set_data_dev(t, /*userMsg*/ ctx[9]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(69:77) {#if userMsg}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import {onMount}
    function create_catch_block$5(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$5.name,
    		type: "catch",
    		source: "(1:0) <script>      import {onMount}",
    		ctx
    	});

    	return block;
    }

    // (72:4) {:then crime}
    function create_then_block$5(ctx) {
    	let table;
    	let thead;
    	let td0;
    	let t1;
    	let td1;
    	let t3;
    	let td2;
    	let t5;
    	let td3;
    	let t7;
    	let td4;
    	let t9;
    	let td5;
    	let t11;
    	let td6;
    	let t13;
    	let td7;
    	let t15;
    	let td8;
    	let t17;
    	let tbody;
    	let td9;
    	let t18;
    	let t19;
    	let td10;
    	let t20;
    	let t21;
    	let td11;
    	let input0;
    	let t22;
    	let td12;
    	let input1;
    	let t23;
    	let td13;
    	let input2;
    	let t24;
    	let td14;
    	let input3;
    	let t25;
    	let td15;
    	let input4;
    	let t26;
    	let td16;
    	let input5;
    	let t27;
    	let td17;
    	let current;
    	let dispose;

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "primary",
    				$$slots: { default: [create_default_slot_1$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*updateCrime*/ ctx[11]);

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			td0 = element("td");
    			td0.textContent = "Country";
    			t1 = space();
    			td1 = element("td");
    			td1.textContent = "Year";
    			t3 = space();
    			td2 = element("td");
    			td2.textContent = "Crime Rate";
    			t5 = space();
    			td3 = element("td");
    			td3.textContent = "Safe Rate";
    			t7 = space();
    			td4 = element("td");
    			td4.textContent = "Homicide Rate";
    			t9 = space();
    			td5 = element("td");
    			td5.textContent = "Homicide Count";
    			t11 = space();
    			td6 = element("td");
    			td6.textContent = "Theft Rate";
    			t13 = space();
    			td7 = element("td");
    			td7.textContent = "Theft Count";
    			t15 = space();
    			td8 = element("td");
    			td8.textContent = "OPCIONES";
    			t17 = space();
    			tbody = element("tbody");
    			td9 = element("td");
    			t18 = text(/*country*/ ctx[1]);
    			t19 = space();
    			td10 = element("td");
    			t20 = text(/*year*/ ctx[2]);
    			t21 = space();
    			td11 = element("td");
    			input0 = element("input");
    			t22 = space();
    			td12 = element("td");
    			input1 = element("input");
    			t23 = space();
    			td13 = element("td");
    			input2 = element("input");
    			t24 = space();
    			td14 = element("td");
    			input3 = element("input");
    			t25 = space();
    			td15 = element("td");
    			input4 = element("input");
    			t26 = space();
    			td16 = element("td");
    			input5 = element("input");
    			t27 = space();
    			td17 = element("td");
    			create_component(button.$$.fragment);
    			add_location(td0, file$9, 74, 12, 2306);
    			add_location(td1, file$9, 75, 4, 2328);
    			add_location(td2, file$9, 76, 4, 2347);
    			add_location(td3, file$9, 77, 4, 2372);
    			add_location(td4, file$9, 78, 4, 2396);
    			add_location(td5, file$9, 79, 4, 2424);
    			add_location(td6, file$9, 80, 4, 2453);
    			add_location(td7, file$9, 81, 4, 2478);
    			add_location(td8, file$9, 82, 4, 2504);
    			add_location(thead, file$9, 73, 8, 2285);
    			add_location(td9, file$9, 85, 12, 2570);
    			add_location(td10, file$9, 86, 16, 2606);
    			add_location(input0, file$9, 87, 20, 2643);
    			add_location(td11, file$9, 87, 16, 2639);
    			add_location(input1, file$9, 88, 20, 2701);
    			add_location(td12, file$9, 88, 16, 2697);
    			add_location(input2, file$9, 89, 20, 2763);
    			add_location(td13, file$9, 89, 16, 2759);
    			add_location(input3, file$9, 90, 20, 2826);
    			add_location(td14, file$9, 90, 16, 2822);
    			add_location(input4, file$9, 91, 20, 2889);
    			add_location(td15, file$9, 91, 16, 2885);
    			add_location(input5, file$9, 92, 20, 2952);
    			add_location(td16, file$9, 92, 16, 2948);
    			add_location(td17, file$9, 93, 16, 3012);
    			add_location(tbody, file$9, 84, 8, 2549);
    			add_location(table, file$9, 72, 4, 2268);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, td0);
    			append_dev(thead, t1);
    			append_dev(thead, td1);
    			append_dev(thead, t3);
    			append_dev(thead, td2);
    			append_dev(thead, t5);
    			append_dev(thead, td3);
    			append_dev(thead, t7);
    			append_dev(thead, td4);
    			append_dev(thead, t9);
    			append_dev(thead, td5);
    			append_dev(thead, t11);
    			append_dev(thead, td6);
    			append_dev(thead, t13);
    			append_dev(thead, td7);
    			append_dev(thead, t15);
    			append_dev(thead, td8);
    			append_dev(table, t17);
    			append_dev(table, tbody);
    			append_dev(tbody, td9);
    			append_dev(td9, t18);
    			append_dev(tbody, t19);
    			append_dev(tbody, td10);
    			append_dev(td10, t20);
    			append_dev(tbody, t21);
    			append_dev(tbody, td11);
    			append_dev(td11, input0);
    			set_input_value(input0, /*cr_rateU*/ ctx[3]);
    			append_dev(tbody, t22);
    			append_dev(tbody, td12);
    			append_dev(td12, input1);
    			set_input_value(input1, /*cr_saferateU*/ ctx[4]);
    			append_dev(tbody, t23);
    			append_dev(tbody, td13);
    			append_dev(td13, input2);
    			set_input_value(input2, /*cr_homicrateU*/ ctx[5]);
    			append_dev(tbody, t24);
    			append_dev(tbody, td14);
    			append_dev(td14, input3);
    			set_input_value(input3, /*cr_homicountU*/ ctx[6]);
    			append_dev(tbody, t25);
    			append_dev(tbody, td15);
    			append_dev(td15, input4);
    			set_input_value(input4, /*cr_theftrateU*/ ctx[7]);
    			append_dev(tbody, t26);
    			append_dev(tbody, td16);
    			append_dev(td16, input5);
    			set_input_value(input5, /*cr_theftcountU*/ ctx[8]);
    			append_dev(tbody, t27);
    			append_dev(tbody, td17);
    			mount_component(button, td17, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[13]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[14]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[15]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[16]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[17]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[18])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*country*/ 2) set_data_dev(t18, /*country*/ ctx[1]);
    			if (!current || dirty & /*year*/ 4) set_data_dev(t20, /*year*/ ctx[2]);

    			if (dirty & /*cr_rateU*/ 8 && input0.value !== /*cr_rateU*/ ctx[3]) {
    				set_input_value(input0, /*cr_rateU*/ ctx[3]);
    			}

    			if (dirty & /*cr_saferateU*/ 16 && input1.value !== /*cr_saferateU*/ ctx[4]) {
    				set_input_value(input1, /*cr_saferateU*/ ctx[4]);
    			}

    			if (dirty & /*cr_homicrateU*/ 32 && input2.value !== /*cr_homicrateU*/ ctx[5]) {
    				set_input_value(input2, /*cr_homicrateU*/ ctx[5]);
    			}

    			if (dirty & /*cr_homicountU*/ 64 && input3.value !== /*cr_homicountU*/ ctx[6]) {
    				set_input_value(input3, /*cr_homicountU*/ ctx[6]);
    			}

    			if (dirty & /*cr_theftrateU*/ 128 && input4.value !== /*cr_theftrateU*/ ctx[7]) {
    				set_input_value(input4, /*cr_theftrateU*/ ctx[7]);
    			}

    			if (dirty & /*cr_theftcountU*/ 256 && input5.value !== /*cr_theftcountU*/ ctx[8]) {
    				set_input_value(input5, /*cr_theftcountU*/ ctx[8]);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 524288) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$5.name,
    		type: "then",
    		source: "(72:4) {:then crime}",
    		ctx
    	});

    	return block;
    }

    // (94:21) <Button outline  color="primary" on:click={updateCrime}>
    function create_default_slot_1$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Actualizar");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$5.name,
    		type: "slot",
    		source: "(94:21) <Button outline  color=\\\"primary\\\" on:click={updateCrime}>",
    		ctx
    	});

    	return block;
    }

    // (70:18)         {:then crime}
    function create_pending_block$5(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$5.name,
    		type: "pending",
    		source: "(70:18)         {:then crime}",
    		ctx
    	});

    	return block;
    }

    // (98:4) <Button outline color="secondary" on:click="{pop}">
    function create_default_slot$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Volver");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(98:4) <Button outline color=\\\"secondary\\\" on:click=\\\"{pop}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let main;
    	let h2;
    	let t0;
    	let t1_value = /*params*/ ctx[0].country + "";
    	let t1;
    	let t2;
    	let t3_value = /*params*/ ctx[0].year + "";
    	let t3;
    	let t4;
    	let t5;
    	let promise;
    	let t6;
    	let current;
    	let if_block = /*userMsg*/ ctx[9] && create_if_block$8(ctx);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$5,
    		then: create_then_block$5,
    		catch: create_catch_block$5,
    		value: 10,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*crime*/ ctx[10], info);

    	const button = new Button({
    			props: {
    				outline: true,
    				color: "secondary",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", pop);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			t0 = text("Editando crimen para el país ");
    			t1 = text(t1_value);
    			t2 = text(" y el año ");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			info.block.c();
    			t6 = space();
    			create_component(button.$$.fragment);
    			add_location(h2, file$9, 68, 4, 2087);
    			add_location(main, file$9, 67, 0, 2075);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			append_dev(h2, t4);
    			if (if_block) if_block.m(h2, null);
    			append_dev(main, t5);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = t6;
    			append_dev(main, t6);
    			mount_component(button, main, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*params*/ 1) && t1_value !== (t1_value = /*params*/ ctx[0].country + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*params*/ 1) && t3_value !== (t3_value = /*params*/ ctx[0].year + "")) set_data_dev(t3, t3_value);

    			if (/*userMsg*/ ctx[9]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					if_block.m(h2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			info.ctx = ctx;

    			if (dirty & /*crime*/ 1024 && promise !== (promise = /*crime*/ ctx[10]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[10] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 524288) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { params = {} } = $$props;
    	let crime = {};
    	let country;
    	let year;
    	let cr_rateU;
    	let cr_saferateU;
    	let cr_homicrateU;
    	let cr_homicountU;
    	let cr_theftrateU;
    	let cr_theftcountU;
    	let userMsg;
    	onMount(getCrime);

    	async function getCrime() {
    		console.log("Buscando crimen...");
    		const res = await fetch("/api/v2/crime-rate-stats/" + params.country + "/" + params.year);

    		if (res.ok) {
    			console.log("OK!");
    			const json = await res.json();
    			$$invalidate(10, crime = json);
    			$$invalidate(1, country = crime.country);
    			$$invalidate(2, year = crime.year);
    			$$invalidate(3, cr_rateU = crime.cr_rate);
    			$$invalidate(4, cr_saferateU = crime.cr_saferate);
    			$$invalidate(5, cr_homicrateU = crime.cr_homicrate);
    			$$invalidate(6, cr_homicountU = crime.cr_homicount);
    			$$invalidate(7, cr_theftrateU = crime.cr_theftrate);
    			$$invalidate(8, cr_theftcountU = crime.cr_theftcount);
    			console.log("Crimen recibido.");
    		} else {
    			console.log("Error, algo ha ido mal");
    		}
    	}

    	async function updateCrime() {
    		console.log("Actualizando crimen con " + JSON.stringify(params.country) + " " + JSON.stringify(params.year));

    		const res = await fetch("/api/v2/crime-rate-stats/" + params.country + "/" + params.year, {
    			method: "PUT",
    			body: JSON.stringify({
    				country,
    				year,
    				cr_rate: cr_rateU,
    				cr_saferate: cr_saferateU,
    				cr_homicrate: cr_homicrateU,
    				cr_homicount: cr_homicountU,
    				cr_theftrate: cr_theftrateU,
    				cr_theftcount: cr_theftcountU
    			}),
    			headers: { "Content-Type": "application/json" }
    		}).then(function (res) {
    			$$invalidate(9, userMsg = "DATO ACTUALIZADO");
    		});
    	}

    	
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<EditCrime> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("EditCrime", $$slots, []);

    	function input0_input_handler() {
    		cr_rateU = this.value;
    		$$invalidate(3, cr_rateU);
    	}

    	function input1_input_handler() {
    		cr_saferateU = this.value;
    		$$invalidate(4, cr_saferateU);
    	}

    	function input2_input_handler() {
    		cr_homicrateU = this.value;
    		$$invalidate(5, cr_homicrateU);
    	}

    	function input3_input_handler() {
    		cr_homicountU = this.value;
    		$$invalidate(6, cr_homicountU);
    	}

    	function input4_input_handler() {
    		cr_theftrateU = this.value;
    		$$invalidate(7, cr_theftrateU);
    	}

    	function input5_input_handler() {
    		cr_theftcountU = this.value;
    		$$invalidate(8, cr_theftcountU);
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Table,
    		Button,
    		pop,
    		params,
    		crime,
    		country,
    		year,
    		cr_rateU,
    		cr_saferateU,
    		cr_homicrateU,
    		cr_homicountU,
    		cr_theftrateU,
    		cr_theftcountU,
    		userMsg,
    		getCrime,
    		updateCrime
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("crime" in $$props) $$invalidate(10, crime = $$props.crime);
    		if ("country" in $$props) $$invalidate(1, country = $$props.country);
    		if ("year" in $$props) $$invalidate(2, year = $$props.year);
    		if ("cr_rateU" in $$props) $$invalidate(3, cr_rateU = $$props.cr_rateU);
    		if ("cr_saferateU" in $$props) $$invalidate(4, cr_saferateU = $$props.cr_saferateU);
    		if ("cr_homicrateU" in $$props) $$invalidate(5, cr_homicrateU = $$props.cr_homicrateU);
    		if ("cr_homicountU" in $$props) $$invalidate(6, cr_homicountU = $$props.cr_homicountU);
    		if ("cr_theftrateU" in $$props) $$invalidate(7, cr_theftrateU = $$props.cr_theftrateU);
    		if ("cr_theftcountU" in $$props) $$invalidate(8, cr_theftcountU = $$props.cr_theftcountU);
    		if ("userMsg" in $$props) $$invalidate(9, userMsg = $$props.userMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		params,
    		country,
    		year,
    		cr_rateU,
    		cr_saferateU,
    		cr_homicrateU,
    		cr_homicountU,
    		cr_theftrateU,
    		cr_theftcountU,
    		userMsg,
    		crime,
    		updateCrime,
    		getCrime,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler
    	];
    }

    class EditCrime extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditCrime",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get params() {
    		throw new Error("<EditCrime>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<EditCrime>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\front\efi\graphs.svelte generated by Svelte v3.22.3 */

    const { console: console_1$7 } = globals;
    const file$a = "src\\front\\efi\\graphs.svelte";

    function create_fragment$b(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let script4;
    	let script4_src_value;
    	let style;
    	let t0;
    	let main;
    	let h1;
    	let t2;
    	let h2;
    	let t4;
    	let figure;
    	let div0;
    	let t5;
    	let p;
    	let t7;
    	let div2;
    	let t8;
    	let br;
    	let t9;
    	let div1;
    	let dispose;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			script4 = element("script");
    			style = element("style");
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "ÍNDICES DE LIBERTAD ECONÓMICA";
    			t2 = space();
    			h2 = element("h2");
    			h2.textContent = "(Economic Freedom Indexes)";
    			t4 = space();
    			figure = element("figure");
    			div0 = element("div");
    			t5 = space();
    			p = element("p");
    			p.textContent = "Aquí veremos un desglose de distintos indices de libertad económica,\r\n        un índice creado por la Heritage Fundation para medir la libertad económica\r\n        de un país.";
    			t7 = space();
    			div2 = element("div");
    			t8 = text("Representación con otra librería\r\n");
    			br = element("br");
    			t9 = space();
    			div1 = element("div");
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$a, 117, 0, 2990);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$a, 118, 0, 3057);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$a, 119, 0, 3131);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$a, 120, 0, 3207);
    			if (script4.src !== (script4_src_value = "https://cdn.plot.ly/plotly-latest.min.js")) attr_dev(script4, "src", script4_src_value);
    			add_location(script4, file$a, 121, 0, 3286);
    			add_location(style, file$a, 122, 0, 3375);
    			add_location(h1, file$a, 127, 0, 3420);
    			add_location(h2, file$a, 128, 0, 3460);
    			attr_dev(div0, "id", "container");
    			add_location(div0, file$a, 130, 4, 3537);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$a, 131, 4, 3569);
    			attr_dev(figure, "class", "highcharts-figure");
    			add_location(figure, file$a, 129, 0, 3497);
    			add_location(br, file$a, 140, 0, 3857);
    			attr_dev(div1, "id", "myDiv");
    			add_location(div1, file$a, 141, 0, 3863);
    			add_location(div2, file$a, 138, 0, 3816);
    			add_location(main, file$a, 126, 0, 3412);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			append_dev(document.head, script4);
    			append_dev(document.head, style);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t2);
    			append_dev(main, h2);
    			append_dev(main, t4);
    			append_dev(main, figure);
    			append_dev(figure, div0);
    			append_dev(figure, t5);
    			append_dev(figure, p);
    			append_dev(main, t7);
    			append_dev(main, div2);
    			append_dev(div2, t8);
    			append_dev(div2, br);
    			append_dev(div2, t9);
    			append_dev(div2, div1);
    			if (remount) dispose();
    			dispose = listen_dev(script4, "load", /*cargaGraph*/ ctx[0], false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			detach_dev(script4);
    			detach_dev(style);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	function dataParser(arrayofData) {
    		let sol = [];
    		let setofcountries = new Set();
    		let setofyears = new Set();

    		//obtenemos el numero de paises
    		arrayofData.forEach(element => {
    			setofcountries.add(element.country);
    			setofyears.add(element.year);
    		});

    		countries = Array.from(setofcountries);
    		years = Array.from(setofyears);

    		for (let k = 0; k < years.length; k++) {
    			let object = {};
    			let efis = [];
    			let efis_2 = [];

    			arrayofData.forEach(element => {
    				if (element.year == years[k]) {
    					efis.push(element.efiindex);
    					let numerito = Math.round(element.efiindex);
    					efis_2.push(numerito.toString());
    				} else {
    					efis.push(0);
    					efis_2.push("0");
    				}
    			});

    			console.log(efis_2);
    			object.data = efis;
    			sol.push(object);
    			let nombre = "Año " + years[k];

    			data_ploty.push({
    				histfunc: "sum",
    				y: efis_2,
    				x: countries,
    				type: "histogram",
    				name: nombre
    			});
    		}

    		return sol;
    	}

    	
    	let countries = [];
    	let years = [];
    	let myData = [];
    	let treatedData = [];
    	let tipo = typeof treatedData;
    	let indices_year = [];
    	let data_ploty = [];

    	async function cargaGraph() {
    		const resData = await fetch("/api/v2/economic-freedom-indexes");
    		myData = await resData.json();
    		treatedData = dataParser(myData);

    		//ploty
    		Plotly.newPlot("myDiv", data_ploty);

    		//highcharts
    		Highcharts.chart("container", {
    			chart: { type: "bar" },
    			title: { text: "Índices de libertad económica" },
    			subtitle: {
    				text: "Source: <a href=\"https://www.heritage.org/index/\">Heritage Foundation</a>"
    			},
    			xAxis: {
    				categories: countries,
    				title: { text: null }
    			},
    			yAxis: {
    				min: 0,
    				title: {
    					text: "Índice de libertad económica",
    					align: "high"
    				},
    				labels: { overflow: "justify" }
    			},
    			plotOptions: { bar: { dataLabels: { enabled: true } } },
    			legend: {
    				layout: "vertical",
    				align: "right",
    				verticalAlign: "top",
    				x: -40,
    				y: 80,
    				floating: true,
    				borderWidth: 1,
    				backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || "#FFFFFF",
    				shadow: true
    			},
    			credits: { enabled: false },
    			series: treatedData
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$7.warn(`<Graphs> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Graphs", $$slots, []);

    	$$self.$capture_state = () => ({
    		dataParser,
    		countries,
    		years,
    		myData,
    		treatedData,
    		tipo,
    		indices_year,
    		data_ploty,
    		cargaGraph
    	});

    	$$self.$inject_state = $$props => {
    		if ("countries" in $$props) countries = $$props.countries;
    		if ("years" in $$props) years = $$props.years;
    		if ("myData" in $$props) myData = $$props.myData;
    		if ("treatedData" in $$props) treatedData = $$props.treatedData;
    		if ("tipo" in $$props) tipo = $$props.tipo;
    		if ("indices_year" in $$props) indices_year = $$props.indices_year;
    		if ("data_ploty" in $$props) data_ploty = $$props.data_ploty;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cargaGraph];
    }

    class Graphs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graphs",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\front\rpc\Integrations.svelte generated by Svelte v3.22.3 */

    const file$b = "src\\front\\rpc\\Integrations.svelte";

    function create_fragment$c(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let ul;
    	let li0;
    	let a0;
    	let t3;
    	let li1;
    	let a1;
    	let t5;
    	let li2;
    	let a2;
    	let t7;
    	let li3;
    	let a3;
    	let t9;
    	let li4;
    	let a4;
    	let t11;
    	let li5;
    	let a5;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Integrations:";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Emigration";
    			t3 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Overdose";
    			t5 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Countries";
    			t7 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "COVID-19";
    			t9 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "ICM";
    			t11 = space();
    			li5 = element("li");
    			a5 = element("a");
    			a5.textContent = "Comun";
    			add_location(h2, file$b, 5, 0, 33);
    			attr_dev(a0, "href", "http://sos1920-11.herokuapp.com/#/rpcs/integrations/emigration");
    			add_location(a0, file$b, 9, 7, 81);
    			add_location(li0, file$b, 9, 3, 77);
    			attr_dev(a1, "href", "http://sos1920-11.herokuapp.com/#/rpcs/integrations/overdose");
    			add_location(a1, file$b, 10, 7, 177);
    			add_location(li1, file$b, 10, 3, 173);
    			attr_dev(a2, "href", "http://sos1920-11.herokuapp.com/#/rpcs/integrations/countries");
    			add_location(a2, file$b, 11, 7, 269);
    			add_location(li2, file$b, 11, 3, 265);
    			attr_dev(a3, "href", "http://sos1920-11.herokuapp.com/#/rpcs/integrations/covid19");
    			add_location(a3, file$b, 12, 7, 363);
    			add_location(li3, file$b, 12, 3, 359);
    			attr_dev(a4, "href", "http://sos1920-11.herokuapp.com/#/rpcs/integrations/icm");
    			add_location(a4, file$b, 13, 7, 454);
    			add_location(li4, file$b, 13, 3, 450);
    			attr_dev(a5, "href", "http://sos1920-11.herokuapp.com/#/rpcs/integrations/comun");
    			add_location(a5, file$b, 14, 7, 537);
    			add_location(li5, file$b, 14, 3, 533);
    			add_location(ul, file$b, 8, 2, 68);
    			add_location(main, file$b, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);
    			append_dev(main, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(li0, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(li1, t5);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(li2, t7);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(li3, t9);
    			append_dev(ul, li4);
    			append_dev(li4, a4);
    			append_dev(li4, t11);
    			append_dev(ul, li5);
    			append_dev(li5, a5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Integrations> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Integrations", $$slots, []);
    	return [];
    }

    class Integrations extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Integrations",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\front\rpc\EmigrationChart.svelte generated by Svelte v3.22.3 */

    const { console: console_1$8 } = globals;
    const file$c = "src\\front\\rpc\\EmigrationChart.svelte";

    function create_fragment$d(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let script4;
    	let script4_src_value;
    	let script5;
    	let script5_src_value;
    	let t0;
    	let main;
    	let figure;
    	let div;
    	let t1;
    	let p;
    	let dispose;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			script4 = element("script");
    			script5 = element("script");
    			t0 = space();
    			main = element("main");
    			figure = element("figure");
    			div = element("div");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Chart showing emigration numbers by country. Clicking on individual columns\r\n        brings up more detailed data. This chart makes use of the drilldown\r\n        feature in Highcharts to easily switch between datasets.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$c, 95, 4, 2126);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/modules/data.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$c, 96, 4, 2197);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/drilldown.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$c, 97, 4, 2270);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$c, 98, 4, 2348);
    			if (script4.src !== (script4_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script4, "src", script4_src_value);
    			add_location(script4, file$c, 99, 4, 2426);
    			if (script5.src !== (script5_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script5, "src", script5_src_value);
    			add_location(script5, file$c, 100, 4, 2506);
    			attr_dev(div, "id", "container");
    			add_location(div, file$c, 105, 4, 2675);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$c, 106, 4, 2707);
    			attr_dev(figure, "class", "highcharts-figure");
    			add_location(figure, file$c, 104, 4, 2635);
    			add_location(main, file$c, 103, 0, 2623);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			append_dev(document.head, script4);
    			append_dev(document.head, script5);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t1);
    			append_dev(figure, p);
    			if (remount) dispose();
    			dispose = listen_dev(script5, "lodad", /*loadGraph*/ ctx[0], false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			detach_dev(script4);
    			detach_dev(script5);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let CountriesData = [];

    	async function loadGraph() {
    		const resData = await fetch("api/v2/emigrants-stats");
    		let DataCountries = [];
    		let SeriesCountries = [];
    		CountriesData = await resData.json();

    		CountriesData.forEach(data => {
    			let country = {
    				"name": data.country + " " + data.year,
    				"y": data.em_totals,
    				"drilldown": data.country
    			};

    			let series = {
    				"name": data.country,
    				"id": data.country,
    				"data": [["em_man", data.em_man], ["em_woman", data.em_woman]]
    			};

    			DataCountries.push(country);
    			SeriesCountries.push(series);
    		});

    		console.log(CountriesData);

    		Highcharts.chart("container", {
    			chart: { type: "column" },
    			title: { text: "Countries emigration" },
    			accessibility: { announceNewData: { enabled: true } },
    			xAxis: { type: "category" },
    			yAxis: { title: { text: "Total emigrations" } },
    			legend: { enabled: false },
    			plotOptions: {
    				series: {
    					borderWidth: 0,
    					dataLabels: { enabled: true, format: "{point.y}" }
    				}
    			},
    			tooltip: {
    				headerFormat: "<span style=\"font-size:11px\">{series.name}</span><br>",
    				pointFormat: "<span style=\"color:{point.color}\">{point.name}</span>: <b>{point.y}</b><br/>"
    			},
    			series: [
    				{
    					name: "Countries",
    					colorByPoint: true,
    					data: DataCountries
    				}
    			],
    			drilldown: { series: SeriesCountries }
    		});
    	}

    	loadGraph();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$8.warn(`<EmigrationChart> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("EmigrationChart", $$slots, []);
    	$$self.$capture_state = () => ({ CountriesData, loadGraph });

    	$$self.$inject_state = $$props => {
    		if ("CountriesData" in $$props) CountriesData = $$props.CountriesData;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loadGraph];
    }

    class EmigrationChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EmigrationChart",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\front\rpc\CountriesChart.svelte generated by Svelte v3.22.3 */

    const { console: console_1$9 } = globals;
    const file$d = "src\\front\\rpc\\CountriesChart.svelte";

    function create_fragment$e(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let script4;
    	let script4_src_value;
    	let script5;
    	let script5_src_value;
    	let t0;
    	let main;
    	let figure;
    	let div;
    	let t1;
    	let p;
    	let dispose;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			script4 = element("script");
    			script5 = element("script");
    			t0 = space();
    			main = element("main");
    			figure = element("figure");
    			div = element("div");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Chart showing basic use of 3D cylindrical columns. A 3D cylinder chart\r\n        is similar to a 3D column chart, with a different shape.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$d, 67, 0, 1330);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/highcharts-3d.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$d, 68, 0, 1397);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/cylinder.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$d, 69, 0, 1467);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$d, 70, 0, 1540);
    			if (script4.src !== (script4_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script4, "src", script4_src_value);
    			add_location(script4, file$d, 71, 0, 1614);
    			if (script5.src !== (script5_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script5, "src", script5_src_value);
    			add_location(script5, file$d, 72, 0, 1690);
    			attr_dev(div, "id", "container");
    			add_location(div, file$d, 78, 4, 1856);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$d, 79, 4, 1888);
    			attr_dev(figure, "class", "highcharts-figure");
    			add_location(figure, file$d, 77, 0, 1816);
    			add_location(main, file$d, 75, 0, 1806);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			append_dev(document.head, script4);
    			append_dev(document.head, script5);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t1);
    			append_dev(figure, p);
    			if (remount) dispose();
    			dispose = listen_dev(script5, "load", /*loadGraph*/ ctx[0], false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			detach_dev(script4);
    			detach_dev(script5);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let Data = [];
    	let countries = [];
    	let CountriesData = [];

    	async function loadGraph() {
    		const resData = await fetch("https://restcountries-v1.p.rapidapi.com/all", {
    			"method": "GET",
    			"headers": {
    				"x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
    				"x-rapidapi-key": "0f1c9a6651mshcc6fb880746f7d2p18a345jsna7eda5bbbed3"
    			}
    		});

    		CountriesData = await resData.json();
    		console.log(CountriesData);

    		CountriesData.forEach(data => {
    			let country = data.name;
    			let area = data.area;
    			countries.push(country);
    			Data.push(area);
    		});

    		Highcharts.chart("container", {
    			chart: {
    				type: "cylinder",
    				options3d: {
    					enabled: true,
    					alpha: 15,
    					beta: 15,
    					depth: 50,
    					viewDistance: 25
    				}
    			},
    			title: { text: "Countries areas" },
    			xAxis: { categories: countries },
    			plotOptions: {
    				series: { depth: 25, colorByPoint: true }
    			},
    			series: [
    				{
    					data: Data,
    					name: "Country Area:",
    					showInLegend: false
    				}
    			]
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$9.warn(`<CountriesChart> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CountriesChart", $$slots, []);

    	$$self.$capture_state = () => ({
    		Data,
    		countries,
    		CountriesData,
    		loadGraph
    	});

    	$$self.$inject_state = $$props => {
    		if ("Data" in $$props) Data = $$props.Data;
    		if ("countries" in $$props) countries = $$props.countries;
    		if ("CountriesData" in $$props) CountriesData = $$props.CountriesData;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loadGraph];
    }

    class CountriesChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CountriesChart",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\front\rpc\OverdoseChart.svelte generated by Svelte v3.22.3 */

    const { console: console_1$a } = globals;
    const file$e = "src\\front\\rpc\\OverdoseChart.svelte";

    function create_fragment$f(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let script4;
    	let script4_src_value;
    	let t0;
    	let main;
    	let figure;
    	let div;
    	let t1;
    	let p;
    	let dispose;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			script4 = element("script");
    			t0 = space();
    			main = element("main");
    			figure = element("figure");
    			div = element("div");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Chart showing overlapping placement of columns, using different data\r\n        series. The chart is also using multiple y-axes, allowing data in\r\n        different ranges to be visualized on the same chart.";
    			if (script0.src !== (script0_src_value = "https://code.jquery.com/jquery-3.1.1.min.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$e, 125, 0, 2867);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$e, 126, 0, 2936);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$e, 127, 0, 3003);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$e, 128, 0, 3077);
    			if (script4.src !== (script4_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script4, "src", script4_src_value);
    			add_location(script4, file$e, 129, 0, 3153);
    			attr_dev(div, "id", "container");
    			add_location(div, file$e, 134, 4, 3317);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$e, 135, 4, 3349);
    			attr_dev(figure, "class", "highcharts-figure");
    			add_location(figure, file$e, 133, 0, 3277);
    			add_location(main, file$e, 132, 0, 3269);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			append_dev(document.head, script4);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t1);
    			append_dev(figure, p);
    			if (remount) dispose();
    			dispose = listen_dev(script4, "load", loadGraph$1, false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			detach_dev(script4);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$1() {
    	let countries = [];
    	let rpcData = [];
    	let totalDeaths = [];
    	let femaleDeaths = [];
    	let maleDeaths = [];
    	let CountriesData1 = [];
    	const resData1 = await fetch("api/v2/rents-per-capita");
    	CountriesData1 = await resData1.json();
    	let CountriesData2 = [];
    	const resData2 = await fetch("api/v2/overdose-deaths");
    	CountriesData2 = await resData2.json();

    	CountriesData1.forEach(data => {
    		let country = data.country + " " + data.year;
    		let rpc = data.rpc;
    		countries.push(country);
    		rpcData.push(rpc);
    		totalDeaths.push("-");
    		femaleDeaths.push("-");
    		maleDeaths.push("-");
    	});

    	CountriesData2.forEach(data => {
    		let country = data.country + " " + data.year;
    		let maledeaths = data.death_male;
    		let femaledeaths = data.death_female;
    		let totaldeaths = data.death_total;
    		countries.push(country);
    		rpcData.push("-");
    		totalDeaths.push(totaldeaths);
    		femaleDeaths.push(femaledeaths);
    		maleDeaths.push(maledeaths);
    	});

    	console.log(CountriesData2);
    	console.log(CountriesData1);

    	Highcharts.chart("container", {
    		chart: { type: "column" },
    		title: {
    			text: "Comparing Rents per capita and Overdose Deaths"
    		},
    		xAxis: { categories: countries },
    		yAxis: [
    			{ min: 0, title: { text: "RPC" } },
    			{
    				title: { text: "Deaths" },
    				opposite: true
    			}
    		],
    		legend: { shadow: false },
    		tooltip: { shared: true },
    		plotOptions: {
    			column: {
    				grouping: false,
    				shadow: false,
    				borderWidth: 0
    			}
    		},
    		series: [
    			{
    				name: "RPC",
    				color: "rgba(165,170,217,1)",
    				data: rpcData,
    				pointPadding: 0.3,
    				pointPlacement: -0.2
    			},
    			{
    				name: "Total Deaths",
    				color: "rgba(126,86,134,.9)",
    				data: totalDeaths,
    				pointPadding: 0.4,
    				pointPlacement: -0.2
    			},
    			{
    				name: "Women Deaths",
    				color: "rgba(248,161,63,1)",
    				data: femaleDeaths,
    				pointPadding: 0.3,
    				pointPlacement: 0.2,
    				yAxis: 1
    			},
    			{
    				name: "Men Deaths",
    				color: "rgba(186,60,61,.9)",
    				data: maleDeaths,
    				pointPadding: 0.4,
    				pointPlacement: 0.2,
    				yAxis: 1
    			}
    		]
    	});
    }

    function instance$f($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$a.warn(`<OverdoseChart> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("OverdoseChart", $$slots, []);
    	$$self.$capture_state = () => ({ loadGraph: loadGraph$1 });
    	return [];
    }

    class OverdoseChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OverdoseChart",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\front\rpc\CovidChart.svelte generated by Svelte v3.22.3 */

    const { console: console_1$b } = globals;
    const file$f = "src\\front\\rpc\\CovidChart.svelte";

    function create_fragment$g(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let script4;
    	let script4_src_value;
    	let t0;
    	let main;
    	let figure;
    	let div;
    	let t1;
    	let p;
    	let dispose;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			script4 = element("script");
    			t0 = space();
    			main = element("main");
    			figure = element("figure");
    			div = element("div");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Packed bubble charts are visualizations where the size and optionally\r\n        the color of the bubbles are used to visualize the data. The positioning\r\n        of the bubbles is not significant, but is optimized for compactness.\r\n        Try dragging the bubbles in this chart around, and see the effects.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$f, 74, 0, 1888);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/highcharts-3d.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$f, 75, 0, 1955);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$f, 76, 0, 2025);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/export-data.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$f, 77, 0, 2099);
    			if (script4.src !== (script4_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script4, "src", script4_src_value);
    			add_location(script4, file$f, 78, 0, 2175);
    			attr_dev(div, "id", "container");
    			add_location(div, file$f, 83, 4, 2339);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$f, 84, 4, 2371);
    			attr_dev(figure, "class", "highcharts-figure");
    			add_location(figure, file$f, 82, 0, 2299);
    			add_location(main, file$f, 81, 0, 2291);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			append_dev(document.head, script4);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t1);
    			append_dev(figure, p);
    			if (remount) dispose();
    			dispose = listen_dev(script4, "load", /*loadGraph*/ ctx[0], false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			detach_dev(script4);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let Data = [];
    	let countries = [];
    	let CountriesData = [];
    	let CountriesData2 = [];

    	async function loadGraph() {
    		const resData = await fetch("https://covid-193.p.rapidapi.com/statistics", {
    			"method": "GET",
    			"headers": {
    				"x-rapidapi-host": "covid-193.p.rapidapi.com",
    				"x-rapidapi-key": "0f1c9a6651mshcc6fb880746f7d2p18a345jsna7eda5bbbed3"
    			}
    		});

    		CountriesData = await resData.json();
    		console.log(CountriesData.response);
    		CountriesData2 = CountriesData.response;

    		CountriesData2.forEach(data => {
    			let country = {
    				"name": data.country,
    				"value": data.deaths.total
    			};

    			Data.push(country);
    		});

    		Highcharts.chart("container", {
    			chart: { type: "packedbubble", height: "100%" },
    			title: { text: "Deaths caused by Covid-19" },
    			tooltip: {
    				useHTML: true,
    				pointFormat: "<b>{point.name}:</b> {point.value} deaths"
    			},
    			plotOptions: {
    				packedbubble: {
    					minSize: "30%",
    					maxSize: "120%",
    					zMin: 0,
    					zMax: 1000,
    					layoutAlgorithm: {
    						splitSeries: false,
    						gravitationalConstant: 0.02
    					},
    					dataLabels: {
    						enabled: true,
    						format: "{point.name}",
    						filter: { property: "y", operator: ">", value: 250 },
    						style: {
    							color: "black",
    							textOutline: "none",
    							fontWeight: "normal"
    						}
    					}
    				}
    			},
    			series: [{ name: "Countries", data: Data }]
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$b.warn(`<CovidChart> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CovidChart", $$slots, []);

    	$$self.$capture_state = () => ({
    		Data,
    		countries,
    		CountriesData,
    		CountriesData2,
    		loadGraph
    	});

    	$$self.$inject_state = $$props => {
    		if ("Data" in $$props) Data = $$props.Data;
    		if ("countries" in $$props) countries = $$props.countries;
    		if ("CountriesData" in $$props) CountriesData = $$props.CountriesData;
    		if ("CountriesData2" in $$props) CountriesData2 = $$props.CountriesData2;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loadGraph];
    }

    class CovidChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CovidChart",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\front\rpc\IcmChart.svelte generated by Svelte v3.22.3 */

    const file$g = "src\\front\\rpc\\IcmChart.svelte";

    function create_fragment$h(ctx) {
    	let script;
    	let script_src_value;
    	let t0;
    	let main;
    	let h2;
    	let t2;
    	let div;
    	let dispose;

    	const block = {
    		c: function create() {
    			script = element("script");
    			t0 = space();
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "ÍNDICES DE MASA CORPORAL (2020)";
    			t2 = space();
    			div = element("div");
    			if (script.src !== (script_src_value = "https://cdn.plot.ly/plotly-latest.min.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file$g, 29, 0, 547);
    			add_location(h2, file$g, 34, 0, 661);
    			attr_dev(div, "id", "myDiv");
    			add_location(div, file$g, 36, 0, 705);
    			add_location(main, file$g, 32, 0, 651);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t2);
    			append_dev(main, div);
    			if (remount) dispose();
    			dispose = listen_dev(script, "load", loadGraph$2, false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$2() {
    	let MyX = [];
    	let MyY = [];
    	let Data = [];
    	const resData = await fetch("/api/v3/indice_de_masa_corporal");
    	Data = await resData.json();

    	Data.filter(data => data.year == 2020).forEach(data => {
    		let x = data.place;
    		MyX.push(x);
    		let y = data.indice_de_masa_corporal;
    		MyY.push(y);
    	});

    	var MyData = [{ x: MyX, y: MyY, type: "bar" }];
    	Plotly.newPlot("myDiv", MyData);
    }

    function instance$h($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IcmChart> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("IcmChart", $$slots, []);
    	$$self.$capture_state = () => ({ loadGraph: loadGraph$2 });
    	return [];
    }

    class IcmChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IcmChart",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\front\rpc\ComunChart.svelte generated by Svelte v3.22.3 */

    const file$h = "src\\front\\rpc\\ComunChart.svelte";

    function create_fragment$i(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let script3;
    	let script3_src_value;
    	let t0;
    	let main;
    	let figure;
    	let div;
    	let t1;
    	let p;
    	let dispose;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			script3 = element("script");
    			t0 = space();
    			main = element("main");
    			figure = element("figure");
    			div = element("div");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Packed bubble charts are visualizations where the size and optionally\r\n        the color of the bubbles are used to visualize the data. The positioning\r\n        of the bubbles is not significant, but is optimized for compactness.\r\n        Try dragging the bubbles in this chart around, and see the effects.";
    			if (script0.src !== (script0_src_value = "https://code.highcharts.com/highcharts.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file$h, 98, 8, 2660);
    			if (script1.src !== (script1_src_value = "https://code.highcharts.com/highcharts-more.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file$h, 99, 8, 2735);
    			if (script2.src !== (script2_src_value = "https://code.highcharts.com/modules/exporting.js")) attr_dev(script2, "src", script2_src_value);
    			add_location(script2, file$h, 100, 8, 2815);
    			if (script3.src !== (script3_src_value = "https://code.highcharts.com/modules/accessibility.js")) attr_dev(script3, "src", script3_src_value);
    			add_location(script3, file$h, 101, 8, 2897);
    			attr_dev(div, "id", "container");
    			add_location(div, file$h, 105, 4, 3069);
    			attr_dev(p, "class", "highcharts-description");
    			add_location(p, file$h, 106, 4, 3101);
    			attr_dev(figure, "class", "highcharts-figure");
    			add_location(figure, file$h, 104, 4, 3029);
    			add_location(main, file$h, 103, 0, 3017);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			append_dev(document.head, script3);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, figure);
    			append_dev(figure, div);
    			append_dev(figure, t1);
    			append_dev(figure, p);
    			if (remount) dispose();
    			dispose = listen_dev(script3, "load", loadGraph$3, false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			detach_dev(script3);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function loadGraph$3() {
    	let RpcData = [];
    	let CrimeData = [];
    	let EfiData = [];
    	let RpcDataGraph = [];
    	let CrimeDataGraph = [];
    	let EfiDataGraph = [];
    	const resData = await fetch("/api/v3/rents-per-capita");
    	RpcData = await resData.json();
    	const resData2 = await fetch("/api/v2/economic-freedom-indexes");
    	EfiData = await resData2.json();
    	const resData3 = await fetch("/api/v2/crime-rate-stats");
    	CrimeData = await resData3.json();

    	RpcData.filter(data => data.year == 2019).forEach(data => {
    		let country = { "name": data.country, "value": data.rpc };
    		RpcDataGraph.push(country);
    	});

    	EfiData.filter(data => data.year == 2019).forEach(data => {
    		let country = {
    			"name": data.country,
    			"value": data.efiindex
    		};

    		EfiDataGraph.push(country);
    	});

    	CrimeData.filter(data => data.year == 2019).forEach(data => {
    		let country = {
    			"name": data.country,
    			"value": data.cr_rate
    		};

    		CrimeDataGraph.push(country);
    	});

    	Highcharts.chart("container", {
    		chart: { type: "packedbubble", height: "100%" },
    		title: {
    			text: "Rents per capita / Economic freedom indexes / Crime rate stats (2019)"
    		},
    		tooltip: {
    			useHTML: true,
    			pointFormat: "<b>{point.name}:</b> {point.value}"
    		},
    		plotOptions: {
    			packedbubble: {
    				minSize: "30%",
    				maxSize: "120%",
    				zMin: 0,
    				zMax: 1000000,
    				layoutAlgorithm: {
    					splitSeries: false,
    					gravitationalConstant: 0.02
    				},
    				dataLabels: {
    					enabled: true,
    					format: "{point.name}",
    					filter: {
    						property: "y",
    						operator: ">",
    						value: 10000
    					},
    					style: {
    						color: "black",
    						textOutline: "none",
    						fontWeight: "normal"
    					}
    				}
    			}
    		},
    		series: [
    			{
    				name: "Rents-per-capita",
    				data: RpcDataGraph
    			},
    			{
    				name: "Economic-freedom-indexes",
    				data: EfiDataGraph
    			},
    			{
    				name: "Crime-rate-stats",
    				data: CrimeDataGraph
    			}
    		]
    	});
    }

    function instance$i($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ComunChart> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ComunChart", $$slots, []);
    	$$self.$capture_state = () => ({ loadGraph: loadGraph$3 });
    	return [];
    }

    class ComunChart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ComunChart",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\front\App.svelte generated by Svelte v3.22.3 */
    const file$i = "src\\front\\App.svelte";

    function create_fragment$j(ctx) {
    	let main;
    	let current;

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(router.$$.fragment);
    			add_location(main, file$i, 39, 0, 1493);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	const routes = {
    		"/": Front,
    		"/rpcs": RpcsTable,
    		"/rpcs/graph": RpcsGraph,
    		"/rpcs/integrations": Integrations,
    		"/rpcs/integrations/emigration": EmigrationChart,
    		"/rpcs/integrations/countries": CountriesChart,
    		"/rpcs/integrations/overdose": OverdoseChart,
    		"/rpcs/integrations/covid19": CovidChart,
    		"/rpcs/integrations/comun": ComunChart,
    		"/rpcs/integrations/icm": IcmChart,
    		"/rpcs/:country/:year": EditRpc,
    		"/efis": Efitable,
    		"/efis/:country/:year": Editefi,
    		"/crimes": CrimeTable,
    		"/crimes/:country:/year": EditCrime,
    		"/efis/graph": Graphs
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		RpcsTable,
    		EditRpc,
    		RpcsGraph,
    		Index: Front,
    		Router,
    		efistable: Efitable,
    		editefi: Editefi,
    		CrimeTable,
    		EditCrime,
    		efiGraph: Graphs,
    		Integrations,
    		EmigrationChart,
    		CountriesChart,
    		OverdoseChart,
    		CovidChart,
    		IcmChart,
    		ComunChart,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    const app = new App({
    	target:  document.querySelector('#SvelteApp'),
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
