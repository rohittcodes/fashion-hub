import { authRouter } from "./router/auth";
import { cartRouter } from "./router/cart";
import { categoryRouter } from "./router/category";
import { orderRouter } from "./router/order";
import { productRouter } from "./router/product";
import { recommendationRouter } from "./router/recommendation";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  product: productRouter,
  category: categoryRouter,
  cart: cartRouter,
  order: orderRouter,
  recommendation: recommendationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
