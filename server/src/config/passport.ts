import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { config } from './index.js';
import { User } from '../models/index.js';

// JWT Strategy
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.jwt.secret,
        },
        async (payload, done) => {
            try {
                const user = await User.findById(payload.userId);
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            } catch (error) {
                return done(error, false);
            }
        }
    )
);

// Google OAuth Strategy
if (config.google.clientId && config.google.clientSecret) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: config.google.clientId,
                clientSecret: config.google.clientSecret,
                callbackURL: config.google.callbackUrl,
                scope: ['profile', 'email'],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Find existing user by Google ID or email
                    let user = await User.findOne({
                        $or: [
                            { googleId: profile.id },
                            { email: profile.emails?.[0]?.value },
                        ],
                    });

                    if (user) {
                        // Update Google ID if not set
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            if (!user.avatar && profile.photos?.[0]?.value) {
                                user.avatar = profile.photos[0].value;
                            }
                            await user.save();
                        }
                    } else {
                        // Create new user
                        user = await User.create({
                            googleId: profile.id,
                            email: profile.emails?.[0]?.value || `${profile.id}@google.com`,
                            name: profile.displayName || 'Google User',
                            avatar: profile.photos?.[0]?.value || '',
                            isVerified: true,
                            isProfileComplete: false, // New users need to complete profile
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}

// Serialize user
passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
