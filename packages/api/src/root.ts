import { authRouter } from "./router/auth";
import { productRouter } from "./router/product";
import { categoryRouter } from "./router/category";
import { cartRouter } from "./router/cart";
import { orderRouter } from "./router/order";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  product: productRouter,
  category: categoryRouter,
  cart: cartRouter,
  order: orderRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
