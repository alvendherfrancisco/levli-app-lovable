/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  		popover: {
  			DEFAULT: 'hsl(var(--popover))',
  			foreground: 'hsl(var(--popover-foreground))'
  		},
  		primary: {
  			DEFAULT: 'hsl(var(--primary))',
  			foreground: 'hsl(var(--primary-foreground))'
  		},
  		secondary: {
  			DEFAULT: 'hsl(var(--secondary))',
  			foreground: 'hsl(var(--secondary-foreground))'
  		},
  		muted: {
  			DEFAULT: 'hsl(var(--muted))',
  			foreground: 'hsl(var(--muted-foreground))'
  		},
  		accent: {
  			DEFAULT: 'hsl(var(--accent))',
  			foreground: 'hsl(var(--accent-foreground))'
  		},
  		destructive: {
  			DEFAULT: 'hsl(var(--destructive))',
  			foreground: 'hsl(var(--destructive-foreground))'
  		},
  		border: 'hsl(var(--border))',
  		input: 'hsl(var(--input))',
  		ring: 'hsl(var(--ring))',
  		// The sign-in screens' own tokens (Login and Create account), defined for
  		// light and dark in src/index.css. Values can carry their own alpha, so a
  		// hairline is a low-opacity white in dark mode.
  		auth: {
  			page: 'rgb(var(--auth-page))',
  			card: 'rgb(var(--auth-card))',
  			border: 'rgb(var(--auth-border))',
  			hover: 'rgb(var(--auth-hover))',
  			input: 'rgb(var(--auth-input))',
  			'input-border': 'rgb(var(--auth-input-border))',
  			text: 'rgb(var(--auth-text))',
  			heading: 'rgb(var(--auth-heading))',
  			muted: 'rgb(var(--auth-muted))',
  			faint: 'rgb(var(--auth-faint))',
  			link: 'rgb(var(--auth-link))',
  			focus: 'rgb(var(--auth-focus))',
  			track: 'rgb(var(--auth-track))',
  			notice: 'rgb(var(--auth-notice-bg))',
  			'notice-border': 'rgb(var(--auth-notice-border))',
  			'notice-text': 'rgb(var(--auth-notice-text))',
  			apple: 'rgb(var(--auth-apple))',
  			'apple-fg': 'rgb(var(--auth-apple-fg))',
  			// The panel a step scrolls inside, the soft edge it leaves through, the
  			// surface a control takes while hovered, the row hairline, the neutral
  			// border, the soft indigo surface and its hairline, and the notice.
  			panel: 'rgb(var(--auth-panel))',
  			fade: 'rgb(var(--auth-fade))',
  			surface: 'rgb(var(--auth-surface))',
  			divider: 'rgb(var(--auth-divider))',
  			'border-strong': 'rgb(var(--auth-border-strong))',
  			tint: 'rgb(var(--auth-tint))',
  			'tint-border': 'rgb(var(--auth-tint-border))',
  			ok: 'rgb(var(--auth-ok-bg))',
  			'ok-border': 'rgb(var(--auth-ok-border))',
  			'ok-text': 'rgb(var(--auth-ok-text))'
  		},
  		chart: {
  			'1': 'hsl(var(--chart-1))',
  			'2': 'hsl(var(--chart-2))',
  			'3': 'hsl(var(--chart-3))',
  			'4': 'hsl(var(--chart-4))',
  			'5': 'hsl(var(--chart-5))'
  		},
  		sidebar: {
  			DEFAULT: 'hsl(var(--sidebar-background))',
  			foreground: 'hsl(var(--sidebar-foreground))',
  			primary: 'hsl(var(--sidebar-primary))',
  			'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  			accent: 'hsl(var(--sidebar-accent))',
  			'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  			border: 'hsl(var(--sidebar-border))',
  			ring: 'hsl(var(--sidebar-ring))'
  		}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'] ,
  			body: ['var(--font-body)'] ,
  			display: ['var(--font-display)'] ,
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
